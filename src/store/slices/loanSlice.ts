import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface LoanState {
  statusFilter: string;
  selectedLoanId: string | null;
  loading: boolean;
  error: string | null;
}

const initialState: LoanState = {
  statusFilter: "ALL",
  selectedLoanId: null,
  loading: false,
  error: null,
};

const loanSlice = createSlice({
  name: "loan",
  initialState,
  reducers: {
    setLoanStatusFilter(state, action: PayloadAction<string>) {
      state.statusFilter = action.payload;
    },
    setSelectedLoanId(state, action: PayloadAction<string | null>) {
      state.selectedLoanId = action.payload;
    },
    setLoanError(state, action: PayloadAction<string | null>) {
      state.error = action.payload;
    },
  },
});

export const { setLoanStatusFilter, setSelectedLoanId, setLoanError } = loanSlice.actions;
export default loanSlice.reducer;
