import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface AuthState {
  user: {
    id: string;
    name: string;
    email: string;
    role: "ADMIN" | "STAFF" | "CUSTOMER";
    twoFactorEnabled: boolean;
  } | null;
  loading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  loading: false,
  error: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setAuthUser(state, action: PayloadAction<AuthState["user"]>) {
      state.user = action.payload;
      state.error = null;
    },
    setAuthLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload;
    },
    setAuthError(state, action: PayloadAction<string | null>) {
      state.error = action.payload;
    },
    clearAuth(state) {
      state.user = null;
      state.error = null;
    },
  },
});

export const { setAuthUser, setAuthLoading, setAuthError, clearAuth } = authSlice.actions;
export default authSlice.reducer;
