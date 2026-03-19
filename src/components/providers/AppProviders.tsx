"use client";

import React from "react";
import { NotificationProvider } from "./NotificationProvider";

const AppProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <NotificationProvider>{children}</NotificationProvider>;
};

export default AppProviders;
