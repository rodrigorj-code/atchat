import React from "react";
import { BrowserRouter, Switch } from "react-router-dom";
import { ToastContainer } from "react-toastify";

import LoggedInLayout from "../layout";
import Signup from "../pages/Signup/";
import Login from "../pages/Login/";
import ForgetPassword from "../pages/ForgetPassWord/";
import { AuthProvider } from "../context/Auth/AuthContext";
import { TicketsContextProvider } from "../context/Tickets/TicketsContext";
import { WhatsAppsProvider } from "../context/WhatsApp/WhatsAppsContext";
import Route from "./Route";
import LoggedInRoutesContent from "./LoggedInRoutesContent";

const Routes = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <TicketsContextProvider>
          <Switch>
            <Route exact path="/login" component={Login} />
            <Route exact path="/signup" component={Signup} />
            <Route exact path="/forgetpsw" component={ForgetPassword} />
            <Route
              isPrivate
              render={() => (
                <WhatsAppsProvider>
                  <LoggedInLayout>
                    <LoggedInRoutesContent />
                  </LoggedInLayout>
                </WhatsAppsProvider>
              )}
            />
          </Switch>
          <ToastContainer autoClose={3000} />
        </TicketsContextProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default Routes;
