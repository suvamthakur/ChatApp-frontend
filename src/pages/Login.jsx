import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { axiosFetch } from "@/lib/axiosFetch";
import { constants } from "@/lib/constants";
import { formValidation } from "@/lib/helper/formValidation";
import { addUser } from "@/store/userSlice";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@radix-ui/react-tabs";
import { useEffect, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

const Login = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [errorMessage, setErrorMessage] = useState(null);

  const name = useRef("");
  const email = useRef("");
  const password = useRef("");

  useEffect(() => {
    getProfile()
      .then(() => {
        navigate("/chat");
      })
      .catch(() => {
        // May be token doesn't exist or has expired
        navigate("/login");
      });
  }, []);

  const getProfile = async () => {
    try {
      const res = await axiosFetch(constants.GET_PROFILE);
      dispatch(addUser(res.data.data));
    } catch (err) {
      throw new Error(err.message);
    }
  };

  const handleSubmit = () => {
    const userName = name?.current?.value;
    const userEmail = email?.current?.value;
    const userPassword = password?.current?.value;
    setErrorMessage(formValidation(userName, userEmail, userPassword));

    if (!errorMessage) {
      if (isLogin) {
        handleLogin(userEmail, userPassword);
      } else {
        handleSingup(userName, userEmail, userPassword);
      }
    }
  };

  const handleSingup = async (name, email, password) => {
    try {
      const res = await axiosFetch.post(constants.SIGN_UP, {
        name,
        email,
        password,
      });
      dispatch(addUser(res.data.data));
      navigate("/chat");
    } catch (err) {
      toast.error(err.response.data.msg);
    }
  };

  const handleLogin = async (email, password) => {
    try {
      const res = await axiosFetch.post(constants.LOGIN, { email, password });
      console.log(res);
      dispatch(addUser(res.data.data));
      navigate("/chat");
    } catch (err) {
      toast.error(err.response.data.msg);
    }
  };

  return (
    <div className="h-[100vh] w-[100vw] flex justify-center items-center">
      <div className="bg-zinc-800 h-[70vh] lg:h-[60vh] w-[80vw] lg:w-[40vw] rounded-md flex flex-col items-center">
        <h1 className="text-3xl font-semibold mt-5 text-zinc-200">
          Welcome back
        </h1>
        <Tabs defaultValue="login" className="w-[90%]">
          <TabsList className="text-zinc-300 text-lg font-medium mt-4">
            <TabsTrigger
              value="login"
              className={
                "w-[50%] py-3 border-b-2 border-transparent " +
                (isLogin ? "border-zinc-700" : "")
              }
              onClick={() => setIsLogin(true)}
            >
              Login
            </TabsTrigger>
            <TabsTrigger
              value="signup"
              className={
                "w-[50%] py-3 border-b-2 border-transparent " +
                (isLogin ? "" : "border-zinc-700")
              }
              onClick={() => setIsLogin(false)}
            >
              Sign up
            </TabsTrigger>
          </TabsList>
          <TabsContent value="login" className="mt-5">
            <Input
              ref={email}
              type="email"
              placeholder="Enter email"
              className="flex h-10 w-full rounded-md border px-3 py-2 text-base text-zinc-300 font-medium mt-3 bg-transparent border-zinc-700 focus:outline-none focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0"
              required
            />

            <Input
              ref={password}
              type="password"
              placeholder="Enter password"
              className="flex h-10 w-full rounded-md border px-3 py-2 text-base text-zinc-300 font-medium mt-3 bg-transparent border-zinc-700 focus:outline-none focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0"
              required
            />
            <p className="text-sm text-red-500 mt-2">{errorMessage}</p>
          </TabsContent>
          <TabsContent value="signup" className="mt-5">
            <Input
              ref={name}
              type="name"
              placeholder="Enter name"
              className="flex h-10 w-full rounded-md border px-3 py-2 text-base text-zinc-300 font-medium mt-3 bg-transparent border-zinc-700 focus:outline-none focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0"
              required
            />
            <Input
              ref={email}
              type="email"
              placeholder="Enter email"
              className="flex h-10 w-full rounded-md border px-3 py-2 text-base text-zinc-300 font-medium mt-3 bg-transparent border-zinc-700 focus:outline-none focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0"
              required
            />
            <Input
              ref={password}
              type="password"
              placeholder="Enter password"
              className="flex h-10 w-full rounded-md border px-3 py-2 text-base text-zinc-300 font-medium mt-3 bg-transparent border-zinc-700 focus:outline-none focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0"
              required
            />
          </TabsContent>
        </Tabs>
        <Button
          className="w-[90%] py-6 text-base mt-auto mb-4"
          onClick={() => handleSubmit()}
        >
          {isLogin ? "Login" : "Sign up"}
        </Button>
      </div>
    </div>
  );
};
export default Login;
