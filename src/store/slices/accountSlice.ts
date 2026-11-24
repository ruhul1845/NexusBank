import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface AccountState {
  selectedAccountId: string | null;
  loading: boolean;
  error: string | null;
}

const initialState: AccountState = {
  selectedAccountId: null,
  loading: false,
  error: null,
};

const accountSlice = createSlice({
  name: "account",
  initialState,
  reducers: {
    setSelectedAccountId(state, action: PayloadAction<string | null>) {
      state.selectedAccountId = action.payload;
    },
    setAccountLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload;
    },
    setAccountError(state, action: PayloadAction<string | null>) {
      state.error = action.payload;
    },
  },
});

export const { setSelectedAccountId, setAccountLoading, setAccountError } = accountSlice.actions;
export default accountSlice.reducer;
