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
import { AxiosError } from "axios";

const Login = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [otp, setOtp] = useState("");
  const [isVerifyOtp, setIsVerifyOtp] = useState(false);
  const [isOtpLoading, setIsOtpLoading] = useState(false);

  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [userPassword, setUserPassword] = useState("");

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
      if (err instanceof Error) {
        throw new Error(err.message);
      } else {
        throw new Error("An unknown error occurred");
      }
    }
  };

  const handleSubmit = () => {
    if (!userEmail || !userPassword) {
      setErrorMessage("Please enter all the details");
      return;
    }
    let error = null;
    if (isLogin) {
      error = formValidation("Test", userEmail, userPassword);
    } else {
      error = formValidation(userName, userEmail, userPassword);
    }
    setErrorMessage(error);

    if (error) {
      toast.error(error);
      return;
    }

    if (isLogin) {
      handleLogin(userEmail, userPassword);
    } else {
      if (!userName) {
        setErrorMessage("Please enter your name");
        return;
      }
      handleSingup(userName, userEmail, userPassword);
    }
  };

  const handleSingup = async (
    name: string,
    email: string,
    password: string
  ) => {
    try {
      setIsLoading(true);
      const res = await axiosFetch.post(constants.SIGN_UP, {
        name,
        email,
        password,
      });
      dispatch(addUser(res.data.data));
      setIsVerifyOtp(true);
    } catch (err) {
      if (err instanceof AxiosError) {
        toast.error(err.response?.data.msg || "Something went wrong!");
      } else {
        toast.error("An unknown error occurred");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const res = await axiosFetch.post(constants.LOGIN, { email, password });
      const data = res.data.data;
      dispatch(addUser(data));

      if (!data.verified) {
        setIsVerifyOtp(true);
        return;
      } else {
        navigate("/chat");
      }
    } catch (err) {
      if (err instanceof AxiosError) {
        toast.error(err.response?.data.msg || "Something went wrong!");
      } else {
        toast.error("An unknown error occurred");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtpAndSignup = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();
    try {
      setIsOtpLoading(true);
      const res = await axiosFetch.post(constants.VERIFY_OTP_SIGNUP, {
        email: userEmail,
        otp,
      });
      const data = res.data.data;
      dispatch(addUser(data));
      navigate("/chat");
    } catch (err) {
      if (err instanceof AxiosError) {
        toast.error(err.response?.data.msg || "Something went wrong!");
      } else {
        toast.error("An unknown error occurred");
      }
    } finally {
      setIsOtpLoading(false);
    }
  };

  const resendOtp = async () => {
    try {
      await axiosFetch.post(constants.SEND_OTP, { email: userEmail });
    } catch (err) {
      if (err instanceof AxiosError) {
        toast.error(err.response?.data.msg || "Something went wrong!");
      } else {
        toast.error("An unknown error occurred");
      }
    }
  };

  return (
    <div className="h-[100vh] w-[100vw] flex justify-center items-center">
      <div className="bg-zinc-800 h-[70vh] lg:h-[60vh] w-[80vw] lg:w-[40vw] rounded-md flex flex-col items-center">
        {isVerifyOtp ? (
          <VerifyOtp
            otp={otp}
            setOtp={setOtp}
            isLoading={isOtpLoading}
            setIsVerifyOtp={setIsVerifyOtp}
            handleSubmit={handleVerifyOtpAndSignup}
            resendOtp={resendOtp}
          />
        ) : (
          <>
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
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  type="email"
                  placeholder="Enter email"
                  className="flex h-10 w-full rounded-md border px-3 py-2 text-base text-zinc-300 font-medium mt-3 bg-transparent border-zinc-700 focus:outline-none focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                  required
                />

                <Input
                  value={userPassword}
                  onChange={(e) => setUserPassword(e.target.value)}
                  type="password"
                  placeholder="Enter password"
                  className="flex h-10 w-full rounded-md border px-3 py-2 text-base text-zinc-300 font-medium mt-3 bg-transparent border-zinc-700 focus:outline-none focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                  required
                />
                <p className="text-sm text-red-500 mt-2">{errorMessage}</p>
              </TabsContent>
              <TabsContent value="signup" className="mt-5">
                <Input
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  type="name"
                  placeholder="Enter name"
                  className="flex h-10 w-full rounded-md border px-3 py-2 text-base text-zinc-300 font-medium mt-3 bg-transparent border-zinc-700 focus:outline-none focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                  required
                />
                <Input
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  type="email"
                  placeholder="Enter email"
                  className="flex h-10 w-full rounded-md border px-3 py-2 text-base text-zinc-300 font-medium mt-3 bg-transparent border-zinc-700 focus:outline-none focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                  required
                />
                <Input
                  value={userPassword}
                  onChange={(e) => setUserPassword(e.target.value)}
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
              disabled={isLoading}
            >
              {isLogin ? "Login" : "Sign up"}
            </Button>
          </>
        )}
      </div>
    </div>
  );
};
export default Login;

type VerifyOtpProps = {
  otp: string;
  setOtp: React.Dispatch<React.SetStateAction<string>>;
  isLoading: boolean;
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  resendOtp: () => void;
  setIsVerifyOtp: React.Dispatch<React.SetStateAction<boolean>>;
};

const VerifyOtp = ({
  otp,
  setOtp,
  isLoading,
  handleSubmit,
  resendOtp,
  setIsVerifyOtp,
  ...props
}: VerifyOtpProps) => {
  const [timer, setTimer] = useState(0);

  useEffect(() => {
    // Start initial timer
    setTimer(30);
  }, []);

  useEffect(() => {
    // Set up countdown timer
    let interval: NodeJS.Timeout;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prevTimer) => prevTimer - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const handleResendOtp = () => {
    if (timer === 0) {
      resendOtp();
      setTimer(30);
    }
  };

  return (
    <div
      className="text-gray-200 w-full h-full flex flex-col justify-center px-8"
      {...props}
    >
      <h2 className="text-2xl font-bold text-center">Verify OTP</h2>

      <form onSubmit={handleSubmit}>
        <div className="mb-2">
          <label htmlFor="otp" className="block mb-2">
            Enter OTP
          </label>
          <input
            type="text"
            id="otp"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            className="w-full px-3 py-2 bg-zinc-700 rounded-md focus:outline-1 focus:outline-zinc-800"
            required
            maxLength={6}
            pattern="\d{6}"
            placeholder="Enter 6-digit OTP"
          />
        </div>
        <div className="mb-4 text-center">
          <p
            onClick={handleResendOtp}
            className={`${
              timer > 0 ? "opacity-80 no-underline" : "cursor-pointer"
            } text-left`}
          >
            Resend OTP {timer > 0 && `in ${timer}s`}
          </p>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-zinc-900 hover:bg-opacity-90 font-bold py-2 px-4 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <p className="animate-pulse [animation-duration:1.1s]">
              Verifying..
            </p>
          ) : (
            "Verify OTP"
          )}
        </button>
      </form>

      <div className="mt-2">
        <p className="text-sm text-center">
          Want to change your Email?{" "}
          <span
            className="text-base text-zinc-200 hover:underline font-medium cursor-pointer"
            onClick={() => setIsVerifyOtp(false)}
          >
            Change Email
          </span>
        </p>
      </div>
    </div>
  );
};
