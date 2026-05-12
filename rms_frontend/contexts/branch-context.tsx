"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import Cookies from "js-cookie";

import { useAuth } from "@/contexts/auth-context";
import { branchesApi } from "@/lib/api/branches";

type BranchOption = { id: number; name: string; address?: string };

interface BranchContextType {
  /** Currently selected branch. `null` = aggregate "All Branches" view (admin only). */
  selectedBranchId: number | null;
  /**
   * True once the current session has explicitly chosen a branch (or "All Branches").
   * When false, the layout renders a blocking branch selector for admins.
   */
  selectionMade: boolean;
  /** Branch IDs the user has access to (empty for admin = unrestricted). */
  availableBranchIds: number[];
  /** Hydrated branch list with names + addresses. */
  availableBranches: BranchOption[];
  /** Whether the branch selector modal is currently open. */
  selectorOpen: boolean;
  /** Whether the loaded branch list is still being fetched. */
  branchesLoading: boolean;
  /** Pick a branch (or `null` for All Branches). Admin only for `null`. */
  setSelectedBranchId: (branchId: number | null) => void;
  /** Open the branch selector modal (used by the "Switch Branch" button). */
  openBranchSelector: () => void;
  /** Close the modal without changing the selection. Only valid once `selectionMade`. */
  closeBranchSelector: () => void;
}

const BranchContext = createContext<BranchContextType | undefined>(undefined);

const STORAGE_KEY_BRANCH = "selectedBranchId";
const STORAGE_KEY_SELECTION_MADE = "branchSelectionMade";
const ALL_BRANCHES_VALUE = "all";

export function BranchProvider({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const [selectedBranchId, setSelectedBranchIdState] = useState<number | null>(
    null
  );
  const [selectionMade, setSelectionMade] = useState(false);
  const [availableBranches, setAvailableBranches] = useState<BranchOption[]>(
    []
  );
  const [branchesLoading, setBranchesLoading] = useState(false);
  const [selectorOpen, setSelectorOpen] = useState(false);

  const availableBranchIds = useMemo(() => user?.branchIds ?? [], [user]);
  const isAdmin = user?.role === "admin";

  const persistSelection = useCallback((branchId: number | null) => {
    if (typeof window === "undefined") return;
    if (branchId === null) {
      localStorage.setItem(STORAGE_KEY_BRANCH, ALL_BRANCHES_VALUE);
    } else {
      localStorage.setItem(STORAGE_KEY_BRANCH, String(branchId));
    }
    localStorage.setItem(STORAGE_KEY_SELECTION_MADE, "true");
  }, []);

  const setSelectedBranchId = useCallback(
    (branchId: number | null) => {
      if (!user) return;
      // Branch managers and HR are pinned to their assigned branch(es).
      if (user.role === "branch_manager") {
        const fallback = user.managedBranchId ?? null;
        setSelectedBranchIdState(fallback);
        persistSelection(fallback);
        setSelectionMade(true);
        return;
      }
      if (user.role === "hr") {
        const fallback = branchId ?? availableBranchIds[0] ?? null;
        const valid =
          fallback !== null && availableBranchIds.includes(fallback)
            ? fallback
            : availableBranchIds[0] ?? null;
        setSelectedBranchIdState(valid);
        persistSelection(valid);
        setSelectionMade(true);
        return;
      }
      // Admin can pick any branch or `null` for "All Branches".
      if (branchId === null) {
        setSelectedBranchIdState(null);
        persistSelection(null);
        setSelectionMade(true);
        return;
      }
      setSelectedBranchIdState(branchId);
      persistSelection(branchId);
      setSelectionMade(true);
    },
    [user, availableBranchIds, persistSelection]
  );

  const openBranchSelector = useCallback(() => setSelectorOpen(true), []);
  const closeBranchSelector = useCallback(() => {
    if (!selectionMade) return; // can't dismiss before initial choice
    setSelectorOpen(false);
  }, [selectionMade]);

  // Reset internal state when the user logs out.
  useEffect(() => {
    if (isAuthenticated) return;
    setSelectedBranchIdState(null);
    setSelectionMade(false);
    setSelectorOpen(false);
    setAvailableBranches([]);
  }, [isAuthenticated]);

  // Hydrate persisted choice + auto-pick for non-admin roles on auth.
  useEffect(() => {
    if (!isAuthenticated || !user) return;
    if (typeof window === "undefined") return;

    const storedSelectionMade =
      localStorage.getItem(STORAGE_KEY_SELECTION_MADE) === "true";
    const storedBranchRaw = localStorage.getItem(STORAGE_KEY_BRANCH);

    if (user.role === "branch_manager") {
      const id = user.managedBranchId ?? null;
      setSelectedBranchIdState(id);
      persistSelection(id);
      setSelectionMade(true);
      setSelectorOpen(false);
      return;
    }

    if (user.role === "hr") {
      const stored = storedBranchRaw && storedBranchRaw !== ALL_BRANCHES_VALUE
        ? Number(storedBranchRaw)
        : null;
      const valid =
        stored !== null && availableBranchIds.includes(stored)
          ? stored
          : availableBranchIds[0] ?? null;
      setSelectedBranchIdState(valid);
      if (valid !== null) persistSelection(valid);
      setSelectionMade(valid !== null);
      setSelectorOpen(false);
      return;
    }

    // Admin path - honor previous selection if present, else show modal.
    if (storedSelectionMade && storedBranchRaw !== null) {
      if (storedBranchRaw === ALL_BRANCHES_VALUE) {
        setSelectedBranchIdState(null);
      } else {
        const parsed = Number(storedBranchRaw);
        setSelectedBranchIdState(Number.isNaN(parsed) ? null : parsed);
      }
      setSelectionMade(true);
      setSelectorOpen(false);
    } else {
      setSelectedBranchIdState(null);
      setSelectionMade(false);
      setSelectorOpen(false);
    }
  }, [isAuthenticated, user, availableBranchIds, persistSelection]);

  // Load branch list (only when authenticated).
  useEffect(() => {
    const token = Cookies.get("token");
    if (!isAuthenticated || !user || !token) {
      setAvailableBranches([]);
      return;
    }

    let cancelled = false;
    const loadBranches = async () => {
      setBranchesLoading(true);
      try {
        const branches = await branchesApi.getBranches();
        if (cancelled) return;
        setAvailableBranches(
          branches.map((b) => ({
            id: b.id,
            name: b.name,
            address: b.address,
          }))
        );
      } catch {
        if (cancelled) return;
        setAvailableBranches(
          availableBranchIds.map((id) => ({ id, name: `Branch #${id}` }))
        );
      } finally {
        if (!cancelled) setBranchesLoading(false);
      }
    };
    loadBranches();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, user, availableBranchIds]);

  const value = useMemo<BranchContextType>(
    () => ({
      selectedBranchId,
      selectionMade,
      availableBranchIds,
      availableBranches,
      selectorOpen,
      branchesLoading,
      setSelectedBranchId,
      openBranchSelector,
      closeBranchSelector,
    }),
    [
      selectedBranchId,
      selectionMade,
      availableBranchIds,
      availableBranches,
      selectorOpen,
      branchesLoading,
      setSelectedBranchId,
      openBranchSelector,
      closeBranchSelector,
    ]
  );

  return (
    <BranchContext.Provider value={value}>{children}</BranchContext.Provider>
  );
}

export function useBranch() {
  const context = useContext(BranchContext);
  if (!context) {
    throw new Error("useBranch must be used within BranchProvider");
  }
  return context;
}
