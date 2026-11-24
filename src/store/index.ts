import { configureStore } from "@reduxjs/toolkit";
import { bankingApi } from "./api/bankingApi";
import authReducer from "./slices/authSlice";
import accountReducer from "./slices/accountSlice";
import transactionReducer from "./slices/transactionSlice";
import loanReducer from "./slices/loanSlice";
import uiReducer from "./slices/uiSlice";

export const store = configureStore({
  reducer: {
    [bankingApi.reducerPath]: bankingApi.reducer,
    auth: authReducer,
    account: accountReducer,
    transaction: transactionReducer,
    loan: loanReducer,
    ui: uiReducer,
  },
  middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(bankingApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
