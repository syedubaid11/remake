import * as yup from "yup";
import { withYup } from "@rvf/yup";

const schema = yup.object({
  email: yup.string().email("Invalid email").required("Email is required"),
  password: yup.string().min(6, "Password too short").required("Password is required"),
});

export const formValidator = withYup(schema);
