import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface UiState {
  darkMode: boolean;
  sidebarOpen: boolean;
  toast: { message: string; type: "success" | "error" | "info" } | null;
}

const initialState: UiState = {
  darkMode: false,
  sidebarOpen: false,
  toast: null,
};

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    toggleDarkMode(state) {
      state.darkMode = !state.darkMode;
    },
    setDarkMode(state, action: PayloadAction<boolean>) {
      state.darkMode = action.payload;
    },
    setSidebarOpen(state, action: PayloadAction<boolean>) {
      state.sidebarOpen = action.payload;
    },
    showToast(state, action: PayloadAction<UiState["toast"]>) {
      state.toast = action.payload;
    },
    clearToast(state) {
      state.toast = null;
    },
  },
});

export const { toggleDarkMode, setDarkMode, setSidebarOpen, showToast, clearToast } = uiSlice.actions;
export default uiSlice.reducer;
