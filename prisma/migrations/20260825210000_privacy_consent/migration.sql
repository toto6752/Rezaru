-- Record of consent to the privacy policy.
--
-- Two columns rather than one flag: under Tajik law №1537 consent is the
-- lawful basis for processing, so we have to be able to say which wording a
-- person agreed to, not merely that they agreed once.
--
-- Both are nullable so existing accounts stay valid; a NULL simply means the
-- account predates the policy and has not accepted it yet.
ALTER TABLE "User" ADD COLUMN     "privacyAcceptedAt" TIMESTAMP(3),
ADD COLUMN     "privacyPolicyVersion" TEXT;
