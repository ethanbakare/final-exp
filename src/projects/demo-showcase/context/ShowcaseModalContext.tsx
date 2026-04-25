import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { ShowcaseModalLayer } from '@/projects/demo-showcase/components/ui/ShowcaseModalLayer';

export interface ShowcaseModalOptions {
  content: React.ReactNode;
  onRequestClose?: () => void;
  closeOnBackdropClick?: boolean;
}

interface ShowcaseModalContextValue {
  openModal: (options: ShowcaseModalOptions) => void;
  closeModal: () => void;
  isModalOpen: boolean;
}

const ShowcaseModalContext = createContext<ShowcaseModalContextValue | null>(null);

export const ShowcaseModalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [modal, setModal] = useState<ShowcaseModalOptions | null>(null);

  const openModal = useCallback((options: ShowcaseModalOptions) => {
    setModal(options);
  }, []);

  const closeModal = useCallback(() => {
    setModal(null);
  }, []);

  const value = useMemo<ShowcaseModalContextValue>(() => ({
    openModal,
    closeModal,
    isModalOpen: modal !== null,
  }), [closeModal, modal, openModal]);

  return (
    <ShowcaseModalContext.Provider value={value}>
      {children}
      <ShowcaseModalLayer modal={modal} closeModal={closeModal} />
    </ShowcaseModalContext.Provider>
  );
};

export const useShowcaseModal = (): ShowcaseModalContextValue => {
  const context = useContext(ShowcaseModalContext);

  if (!context) {
    throw new Error('useShowcaseModal must be used within a ShowcaseModalProvider');
  }

  return context;
};
