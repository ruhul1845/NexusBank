import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export interface BankAccountDTO {
  id: string;
  accountNumber: string;
  userId: string;
  accountType: "SAVINGS" | "CURRENT" | "BUSINESS";
  balance: number;
  status: "ACTIVE" | "FROZEN" | "CLOSED";
  dailyTransferLimit: number;
  maxSingleTransfer: number;
  minBalance: number;
  currency: string;
  createdAt: string;
  user?: {
    id: string;
    name: string;
    email: string;
    status: string;
    isVerified: boolean;
  };
}

export interface TransactionDTO {
  id: string;
  referenceId: string;
  senderAccountId: string | null;
  receiverAccountId: string | null;
  type: "DEPOSIT" | "WITHDRAWAL" | "FUND_TRANSFER" | "LOAN_DISBURSEMENT" | "LOAN_REPAYMENT";
  amount: number;
  fee: number;
  status: "PENDING" | "COMPLETED" | "FAILED" | "REVERSED";
  description: string;
  isFlagged: boolean;
  flagReason: string | null;
  createdAt: string;
  senderAccount?: { accountNumber: string; accountType: string; user: { id: string; name: string; email: string } } | null;
  receiverAccount?: { accountNumber: string; accountType: string; user: { id: string; name: string; email: string } } | null;
}

export interface DepositWithdrawalDTO {
  id: string;
  accountId: string;
  userId: string;
  type: "DEPOSIT" | "WITHDRAWAL";
  amount: number;
  description: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  requestDate: string;
  rejectionReason: string | null;
  account: { accountNumber: string; accountType: string; balance: number };
  user?: { id: string; name: string; email: string };
}

export interface LoanRepaymentDTO {
  id: string;
  installmentNumber: number;
  dueDate: string;
  amountDue: number;
  principalPart: number;
  interestPart: number;
  amountPaid: number;
  status: "PENDING" | "PAID" | "OVERDUE";
  paidAt: string | null;
}

export interface LoanDTO {
  id: string;
  userId: string;
  accountId: string;
  loanType: "PERSONAL" | "HOME" | "AUTO" | "BUSINESS" | "EDUCATION";
  requestedAmount: number;
  approvedAmount: number | null;
  durationMonths: number;
  interestRate: number;
  monthlyIncome: number;
  employmentStatus: string;
  description: string;
  status: "PENDING" | "UNDER_REVIEW" | "APPROVED" | "REJECTED" | "ACTIVE" | "COMPLETED";
  staffNotes: string | null;
  remainingBalance: number;
  disbursedAt: string | null;
  createdAt: string;
  user?: { id: string; name: string; email: string; isVerified: boolean };
  account?: { id: string; accountNumber: string; accountType: string };
  repayments: LoanRepaymentDTO[];
}

export interface CustomerDTO {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  address: string | null;
  status: "ACTIVE" | "DEACTIVATED" | "BLOCKED";
  isVerified: boolean;
  twoFactorEnabled: boolean;
  createdAt: string;
  accounts: Array<{ id: string; accountNumber: string; accountType: string; balance: number; status: string }>;
  totalBalance: number;
  _count?: { loans: number };
}

export interface NotificationDTO {
  id: string;
  title: string;
  message: string;
  type: "TRANSACTION" | "DEPOSIT_WITHDRAWAL" | "LOAN" | "SECURITY";
  isRead: boolean;
  emailSent: boolean;
  createdAt: string;
}

export interface BankSettingsDTO {
  defaultDailyTransferLimit: number;
  defaultMaxSingleTransfer: number;
  defaultMinBalance: number;
  transferFeePercent: number;
  suspiciousAmountThreshold: number;
}

export const bankingApi = createApi({
  reducerPath: "bankingApi",
  baseQuery: fetchBaseQuery({ baseUrl: "/api" }),
  tagTypes: ["Accounts", "Transactions", "Requests", "Loans", "Customers", "Notifications", "Analytics", "Settings"],
  endpoints: (builder) => ({
    getAccounts: builder.query<BankAccountDTO[], { search?: string } | void>({
      query: (arg) => (arg && arg.search ? `/accounts?search=${encodeURIComponent(arg.search)}` : "/accounts"),
      providesTags: ["Accounts"],
    }),
    createAccount: builder.mutation<BankAccountDTO, { userId: string; accountType: string; initialDeposit: number }>({
      query: (body) => ({ url: "/accounts", method: "POST", body }),
      invalidatesTags: ["Accounts", "Customers", "Analytics", "Transactions"],
    }),
    updateAccount: builder.mutation<BankAccountDTO, { id: string; data: Partial<BankAccountDTO> }>({
      query: ({ id, data }) => ({ url: `/accounts/${id}`, method: "PATCH", body: data }),
      invalidatesTags: ["Accounts", "Customers", "Analytics"],
    }),
    lookupRecipient: builder.query<{ accountNumber: string; accountType: string; status: string; holderName: string }, string>({
      query: (accountNumber) => `/accounts/lookup?accountNumber=${encodeURIComponent(accountNumber)}`,
    }),
    getTransactions: builder.query<
      { items: TransactionDTO[]; total: number; page: number; totalPages: number },
      { page?: number; limit?: number; search?: string; type?: string; status?: string; accountId?: string; startDate?: string; endDate?: string; flagged?: boolean }
    >({
      query: (params) => {
        const sp = new URLSearchParams();
        if (params.page) sp.set("page", String(params.page));
        if (params.limit) sp.set("limit", String(params.limit));
        if (params.search) sp.set("search", params.search);
        if (params.type && params.type !== "ALL") sp.set("type", params.type);
        if (params.status && params.status !== "ALL") sp.set("status", params.status);
        if (params.accountId) sp.set("accountId", params.accountId);
        if (params.startDate) sp.set("startDate", params.startDate);
        if (params.endDate) sp.set("endDate", params.endDate);
        if (params.flagged) sp.set("flagged", "true");
        return `/transactions?${sp.toString()}`;
      },
      providesTags: ["Transactions"],
    }),
    transferFunds: builder.mutation<
      TransactionDTO,
      {
        senderAccountId: string;
        recipientAccountNumber: string;
        amount: number;
        description: string;
        transactionPin: string;
        idempotencyKey?: string;
        twoFactorCode?: string;
      }
    >({
      query: (body) => ({ url: "/transactions/transfer", method: "POST", body }),
      invalidatesTags: ["Accounts", "Transactions", "Notifications", "Analytics"],
    }),
    reviewTransaction: builder.mutation<TransactionDTO, { id: string; action: "FLAG" | "CLEAR_FLAG" | "REVERSE"; reason?: string }>({
      query: ({ id, ...body }) => ({ url: `/transactions/${id}`, method: "PATCH", body }),
      invalidatesTags: ["Transactions", "Accounts", "Analytics"],
    }),
    getRequests: builder.query<DepositWithdrawalDTO[], { status?: string } | void>({
      query: (arg) => (arg?.status ? `/deposit-withdrawals?status=${arg.status}` : "/deposit-withdrawals"),
      providesTags: ["Requests"],
    }),
    createRequest: builder.mutation<DepositWithdrawalDTO, { accountId: string; type: "DEPOSIT" | "WITHDRAWAL"; amount: number; description: string }>({
      query: (body) => ({ url: "/deposit-withdrawals", method: "POST", body }),
      invalidatesTags: ["Requests"],
    }),
    processRequest: builder.mutation<DepositWithdrawalDTO, { id: string; decision: "APPROVED" | "REJECTED"; rejectionReason?: string }>({
      query: ({ id, ...body }) => ({ url: `/deposit-withdrawals/${id}`, method: "PATCH", body }),
      invalidatesTags: ["Requests", "Accounts", "Transactions", "Notifications", "Analytics"],
    }),
    getLoans: builder.query<LoanDTO[], void>({
      query: () => "/loans",
      providesTags: ["Loans"],
    }),
    applyLoan: builder.mutation<
      LoanDTO,
      {
        accountId: string;
        loanType: string;
        requestedAmount: number;
        durationMonths: number;
        monthlyIncome: number;
        employmentStatus: string;
        description: string;
      }
    >({
      query: (body) => ({ url: "/loans", method: "POST", body }),
      invalidatesTags: ["Loans", "Analytics"],
    }),
    reviewLoan: builder.mutation<LoanDTO, { id: string; action: "FORWARD" | "APPROVE" | "REJECT"; staffNotes?: string; approvedAmount?: number }>({
      query: ({ id, ...body }) => ({ url: `/loans/${id}`, method: "PATCH", body }),
      invalidatesTags: ["Loans", "Accounts", "Transactions", "Notifications", "Analytics"],
    }),
    repayLoan: builder.mutation<{ message: string; remainingBalance: number; status: string }, { loanId: string; repaymentId: string; accountId: string }>({
      query: ({ loanId, ...body }) => ({ url: `/loans/${loanId}/repay`, method: "POST", body }),
      invalidatesTags: ["Loans", "Accounts", "Transactions", "Notifications", "Analytics"],
    }),
    getCustomers: builder.query<CustomerDTO[], { search?: string } | void>({
      query: (arg) => (arg?.search ? `/customers?search=${encodeURIComponent(arg.search)}` : "/customers"),
      providesTags: ["Customers"],
    }),
    createCustomer: builder.mutation<{ id: string; name: string; email: string; accountNumber: string }, Record<string, unknown>>({
      query: (body) => ({ url: "/customers", method: "POST", body }),
      invalidatesTags: ["Customers", "Accounts", "Analytics"],
    }),
    updateCustomer: builder.mutation<{ id: string; status: string; isVerified: boolean }, { id: string; status?: string; isVerified?: boolean }>({
      query: ({ id, ...body }) => ({ url: `/customers/${id}`, method: "PATCH", body }),
      invalidatesTags: ["Customers", "Accounts"],
    }),
    getAnalytics: builder.query<Record<string, unknown>, { scope: "admin" | "customer" }>({
      query: ({ scope }) => `/analytics?scope=${scope}`,
      providesTags: ["Analytics"],
    }),
    getNotifications: builder.query<NotificationDTO[], void>({
      query: () => "/notifications",
      providesTags: ["Notifications"],
    }),
    markNotificationsRead: builder.mutation<{ success: boolean }, { id?: string } | void>({
      query: (body) => ({ url: "/notifications", method: "PATCH", body: body || {} }),
      invalidatesTags: ["Notifications"],
    }),
    getSettings: builder.query<BankSettingsDTO, void>({
      query: () => "/settings",
      providesTags: ["Settings"],
    }),
    updateSettings: builder.mutation<BankSettingsDTO, BankSettingsDTO>({
      query: (body) => ({ url: "/settings", method: "PATCH", body }),
      invalidatesTags: ["Settings"],
    }),
  }),
});

export const {
  useGetAccountsQuery,
  useCreateAccountMutation,
  useUpdateAccountMutation,
  useLazyLookupRecipientQuery,
  useGetTransactionsQuery,
  useTransferFundsMutation,
  useReviewTransactionMutation,
  useGetRequestsQuery,
  useCreateRequestMutation,
  useProcessRequestMutation,
  useGetLoansQuery,
  useApplyLoanMutation,
  useReviewLoanMutation,
  useRepayLoanMutation,
  useGetCustomersQuery,
  useCreateCustomerMutation,
  useUpdateCustomerMutation,
  useGetAnalyticsQuery,
  useGetNotificationsQuery,
  useMarkNotificationsReadMutation,
  useGetSettingsQuery,
  useUpdateSettingsMutation,
} = bankingApi;
