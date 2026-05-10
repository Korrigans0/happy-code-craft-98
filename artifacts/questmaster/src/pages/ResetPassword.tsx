import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const ResetPassword = () => {
  const navigate = useNavigate();
  useEffect(() => { navigate("/sign-in", { replace: true }); }, [navigate]);
  return null;
};

export default ResetPassword;
