export const formValidation = (
  name = "Abc",
  email: string,
  password: string
) => {
  const isNameValid = /^[A-Za-zÀ-ÿ]+(?: [A-Za-zÀ-ÿ]+)*$/.test(name);
  const isEmailValid = /^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email);
  const isPasswordValid = /^(?=.*\d)(?=.*[a-zA-Z]).{6,}$/.test(password);

  if (!isNameValid) return "Invalid name! Include only letters and spaces.";

  if (!isEmailValid) return "Invalid email format!";

  if (!isPasswordValid)
    return "Invalid password! At least 8 characters with a letter and number.";

  return null;
};
