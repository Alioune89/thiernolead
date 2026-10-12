-- Tables
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  entreprise TEXT,
  offre TEXT,
  benefice_client TEXT,
  nom_expediteur TEXT,
  telephone_expediteur TEXT,
  langue_defaut TEXT DEFAULT 'fr',
  ton_defaut TEXT DEFAULT 'formel',
  credits INT NOT NULL DEFAULT 0,
  onboarded BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TYPE search_status AS ENUM ('pending', 'running', 'succeeded', 'failed');

CREATE TABLE searches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) NOT NULL,
  secteur TEXT NOT NULL,
  ville TEXT NOT NULL,
  pays TEXT NOT NULL,
  max_results INT NOT NULL,
  with_emails BOOLEAN NOT NULL DEFAULT false,
  statut search_status NOT NULL DEFAULT 'pending',
  apify_run_id TEXT,
  results_count INT DEFAULT 0,
  credits_reserved INT NOT NULL DEFAULT 0,
  credits_billed INT NOT NULL DEFAULT 0,
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) NOT NULL,
  search_id UUID REFERENCES searches(id) NOT NULL,
  place_id TEXT NOT NULL,
  nom TEXT NOT NULL,
  categorie TEXT,
  adresse TEXT,
  telephone_brut TEXT,
  telephone_e164 TEXT,
  is_mobile BOOLEAN DEFAULT false,
  lien_whatsapp TEXT,
  email TEXT,
  site_web TEXT,
  lien_google_maps TEXT,
  note NUMERIC(3, 1),
  nb_avis INT,
  lat NUMERIC,
  lng NUMERIC,
  statut_prospection TEXT DEFAULT 'nouveau',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(search_id, place_id)
);

CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) NOT NULL,
  lead_id UUID REFERENCES leads(id) NOT NULL,
  canal TEXT NOT NULL, -- 'whatsapp' | 'email'
  langue TEXT NOT NULL,
  ton TEXT NOT NULL,
  objet TEXT,
  corps TEXT NOT NULL,
  modele TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) NOT NULL,
  amount INT NOT NULL, -- positive ou negative
  motif TEXT NOT NULL, -- bonus, achat, reservation, remboursement, message
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) NOT NULL,
  pack TEXT NOT NULL,
  montant INT NOT NULL,
  devise TEXT NOT NULL DEFAULT 'XOF',
  credits INT NOT NULL,
  transaction_id TEXT UNIQUE NOT NULL,
  statut TEXT NOT NULL DEFAULT 'pending',
  reponse_brute JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS (Row Level Security)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE searches ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
-- Notice that we prevent users from updating 'credits' via RLS, or we can use a separate view/trigger, but typically we do it via SECURITY DEFINER functions.
-- It's better to explicitly exclude credits from UPDATE in Postgres if possible, but standard is letting the backend handle it or wrapping in function.

CREATE POLICY "Users can view their own searches" ON searches FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can view their own leads" ON leads FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own leads" ON leads FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own messages" ON messages FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can view their own credit transactions" ON credit_transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can view their own payments" ON payments FOR SELECT USING (auth.uid() = user_id);


-- Functions SQL
CREATE OR REPLACE FUNCTION spend_credits(user_id_param UUID, amount INT, motif_param TEXT) 
RETURNS void AS $$
DECLARE
  current_credits INT;
BEGIN
  SELECT credits INTO current_credits FROM profiles WHERE id = user_id_param FOR UPDATE;
  IF current_credits < amount THEN
    RAISE EXCEPTION 'INSUFFICIENT_CREDITS';
  END IF;

  UPDATE profiles SET credits = credits - amount WHERE id = user_id_param;
  INSERT INTO credit_transactions (user_id, amount, motif) VALUES (user_id_param, -amount, motif_param);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


CREATE OR REPLACE FUNCTION add_credits(user_id_param UUID, amount INT, motif_param TEXT) 
RETURNS void AS $$
BEGIN
  UPDATE profiles SET credits = credits + amount WHERE id = user_id_param;
  INSERT INTO credit_transactions (user_id, amount, motif) VALUES (user_id_param, amount, motif_param);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


CREATE OR REPLACE FUNCTION apply_payment(txn_id_param TEXT, p_statut TEXT, p_reponse JSONB) 
RETURNS void AS $$
DECLARE
  pay_rec RECORD;
BEGIN
  SELECT * INTO pay_rec FROM payments WHERE transaction_id = txn_id_param FOR UPDATE;
  
  IF pay_rec.statut = 'ACCEPTED' THEN
    RETURN; -- Already processed
  END IF;

  UPDATE payments 
  SET statut = p_statut, reponse_brute = p_reponse, updated_at = NOW() 
  WHERE transaction_id = txn_id_param;

  IF p_statut = 'ACCEPTED' THEN
    PERFORM add_credits(pay_rec.user_id, pay_rec.credits, 'achat');
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Trigger create profile
CREATE OR REPLACE FUNCTION handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, credits, onboarded)
  VALUES (new.id, 20, false);
  
  INSERT INTO public.credit_transactions (user_id, amount, motif)
  VALUES (new.id, 20, 'bonus');
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
