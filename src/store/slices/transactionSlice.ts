import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface TransactionState {
  search: string;
  typeFilter: string;
  statusFilter: string;
  startDate: string;
  endDate: string;
  page: number;
  loading: boolean;
  error: string | null;
}

const initialState: TransactionState = {
  search: "",
  typeFilter: "ALL",
  statusFilter: "ALL",
  startDate: "",
  endDate: "",
  page: 1,
  loading: false,
  error: null,
};

const transactionSlice = createSlice({
  name: "transaction",
  initialState,
  reducers: {
    setTransactionSearch(state, action: PayloadAction<string>) {
      state.search = action.payload;
      state.page = 1;
    },
    setTransactionTypeFilter(state, action: PayloadAction<string>) {
      state.typeFilter = action.payload;
      state.page = 1;
    },
    setTransactionStatusFilter(state, action: PayloadAction<string>) {
      state.statusFilter = action.payload;
      state.page = 1;
    },
    setTransactionDateRange(state, action: PayloadAction<{ startDate: string; endDate: string }>) {
      state.startDate = action.payload.startDate;
      state.endDate = action.payload.endDate;
      state.page = 1;
    },
    setTransactionPage(state, action: PayloadAction<number>) {
      state.page = action.payload;
    },
    resetTransactionFilters() {
      return initialState;
    },
  },
});

export const {
  setTransactionSearch,
  setTransactionTypeFilter,
  setTransactionStatusFilter,
  setTransactionDateRange,
  setTransactionPage,
  resetTransactionFilters,
} = transactionSlice.actions;
export default transactionSlice.reducer;
