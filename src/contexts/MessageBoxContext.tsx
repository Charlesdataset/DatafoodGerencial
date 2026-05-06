import { createContext, useContext, useState, useMemo } from "react";
import NewMessageBox from "../components/MessageBox/MessageBox";

const MessageBoxContext = createContext(null);

export function MessageBoxProvider({ children }) {
  const [state, setState] = useState({
    isOpen: false,
    data: {},
    resolver: null,
  });

  const confirm = (data) => {
    return new Promise((resolve) => {
      setState({
        isOpen: true,
        data,
        resolver: resolve,
      });
    });
  };

  const handleClose = (result) => {
    state.resolver?.(result);
    setState({ isOpen: false, data: {}, resolver: null });
  };

  const value = useMemo(() => ({ confirm }), []);

  return (
    <MessageBoxContext.Provider value={value}>
      {children}

      <NewMessageBox
        isOpen={state.isOpen}
        data={state.data}
        onClose={() => handleClose(false)}
        onConfirm={() => handleClose(true)}
      />
    </MessageBoxContext.Provider>
  );
}

export const useMessageBox = () => useContext(MessageBoxContext);
