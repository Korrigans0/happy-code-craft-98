REVOKE EXECUTE ON FUNCTION public.create_talespire_link_code() FROM authenticated;
COMMENT ON TABLE public.talespire_link_codes IS 'DEPRECATED: TaleSpire linking uses the OAuth authorization code shown on /talespire/link';
COMMENT ON FUNCTION public.create_talespire_link_code() IS 'DEPRECATED';
COMMENT ON FUNCTION public.consume_talespire_link_code(text) IS 'DEPRECATED';