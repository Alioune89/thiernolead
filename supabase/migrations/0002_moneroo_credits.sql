-- 0002 — Système de crédits Moneroo
--   • 5 crédits offerts à l'inscription (au lieu de 20) + 5 crédits offerts une fois à chaque compte existant
--   • Table payments adaptée au checkout Moneroo + RPC idempotente complete_payment
--   • Verrouillage : les crédits ne peuvent plus être modifiés depuis le navigateur
-- Rejouable sans risque : le bonus des comptes existants n'est versé qu'une seule fois.

-- ─────────────────────────────────────────────────────────────────────────
-- 1. Bonus de bienvenue : 5 crédits pour les nouveaux comptes
-- ─────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, credits, onboarded)
  VALUES (new.id, 5, false);

  INSERT INTO public.credit_transactions (user_id, amount, motif)
  VALUES (new.id, 5, 'bonus_bienvenue');

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ─────────────────────────────────────────────────────────────────────────
-- 2. 5 crédits offerts aux comptes existants (une seule fois par compte)
-- ─────────────────────────────────────────────────────────────────────────

WITH eligible AS (
  SELECT p.id
  FROM public.profiles p
  WHERE NOT EXISTS (
    SELECT 1 FROM public.credit_transactions t
    WHERE t.user_id = p.id AND t.motif = 'bonus_bienvenue'
  )
),
credited AS (
  UPDATE public.profiles
  SET credits = credits + 5, updated_at = NOW()
  WHERE id IN (SELECT id FROM eligible)
  RETURNING id
)
INSERT INTO public.credit_transactions (user_id, amount, motif)
SELECT id, 5, 'bonus_bienvenue' FROM credited;

-- ─────────────────────────────────────────────────────────────────────────
-- 3. Table payments : champs Moneroo
--    transaction_id = id Moneroo (py_…), connu seulement après l'initialisation
--    statut : pending → completed | failed
-- ─────────────────────────────────────────────────────────────────────────

ALTER TABLE public.payments ALTER COLUMN transaction_id DROP NOT NULL;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS provider TEXT NOT NULL DEFAULT 'moneroo';
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS checkout_url TEXT;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS failure_reason TEXT;
CREATE INDEX IF NOT EXISTS payments_user_created_idx ON public.payments (user_id, created_at DESC);

-- ─────────────────────────────────────────────────────────────────────────
-- 4. Règlement idempotent d'un paiement
--    Le verrou FOR UPDATE + la garde statut = 'pending' garantissent qu'un même
--    paiement ne crédite jamais deux fois (webhooks rejoués, page de retour rechargée).
-- ─────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.complete_payment(
  p_payment_id UUID,
  p_statut TEXT,
  p_reponse JSONB,
  p_failure_reason TEXT DEFAULT NULL
)
RETURNS TEXT AS $$
DECLARE
  pay_rec public.payments%ROWTYPE;
BEGIN
  IF p_statut NOT IN ('completed', 'failed') THEN
    RAISE EXCEPTION 'INVALID_PAYMENT_STATUS';
  END IF;

  SELECT * INTO pay_rec FROM public.payments WHERE id = p_payment_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  IF pay_rec.statut <> 'pending' THEN
    RETURN pay_rec.statut;
  END IF;

  UPDATE public.payments
  SET statut = p_statut, reponse_brute = p_reponse, failure_reason = p_failure_reason, updated_at = NOW()
  WHERE id = p_payment_id;

  IF p_statut = 'completed' THEN
    PERFORM public.add_credits(pay_rec.user_id, pay_rec.credits, 'achat_moneroo');
  END IF;

  RETURN p_statut;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ─────────────────────────────────────────────────────────────────────────
-- 5. Sécurité des crédits
--    Par défaut Supabase autorise anon/authenticated à appeler toute fonction du
--    schéma public via /rest/v1/rpc : n'importe quel utilisateur pouvait appeler
--    add_credits pour se créditer. Seul le service role (serveur) y a désormais accès.
-- ─────────────────────────────────────────────────────────────────────────

DO $$
DECLARE
  fn TEXT;
BEGIN
  FOREACH fn IN ARRAY ARRAY[
    'public.spend_credits(uuid,integer,text)',
    'public.add_credits(uuid,integer,text)',
    'public.apply_payment(text,text,jsonb)',
    'public.complete_payment(uuid,text,jsonb,text)'
  ] LOOP
    IF to_regprocedure(fn) IS NOT NULL THEN
      EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM PUBLIC, anon, authenticated', fn);
      EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role', fn);
    END IF;
  END LOOP;
END $$;

-- La policy "Users can update their own profile" laissait aussi modifier la colonne
-- credits depuis le navigateur. On limite l'UPDATE aux champs de la page Paramètres.
REVOKE UPDATE ON public.profiles FROM anon, authenticated;
GRANT UPDATE (
  entreprise, offre, benefice_client, nom_expediteur, telephone_expediteur,
  langue_defaut, ton_defaut, onboarded, updated_at
) ON public.profiles TO authenticated;
