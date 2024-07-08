'use client';
import {signIn} from "next-auth/react";

export default function LoginScreen() {
  return (
    <div className="bg-white mt-8 max-w-nd border border-blue-100 border-b-4 mx-auto rounded-xl p-4 text-center">
      <h2 className="text-gray-300 text-lg uppercase">Welcome back</h2>
      <h1 className="font-bold text-3xl nb-4">Login to your account</h1>
      <button
        onClick={() => signIn('google')}
        className="nb-4 bg-indigo-500 text-white px-6 py-2 rounded-xl border border-indigo-700 border-b-4 inline-flex gap-2 items-center">
          <img className="w-4 invert" src="https://www.svgrepo.com/show/50809/google.svg" alt="" />
          Login with google
      </button>
    </div>
  );
}