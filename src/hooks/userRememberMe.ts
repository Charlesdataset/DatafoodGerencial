import { useEffect, useState } from 'react';

interface RememberMeData {
  codigo: string;
  senha: string;
  cnpj: string;
}

export const useRememberMe = () => {
  const [lembrar, setLembrar] = useState(false);
  const [credentials, setCredentials] = useState<RememberMeData>({ codigo: '', senha: '', cnpj: '' });

  // Carregar credenciais salvas ao iniciar
  useEffect(() => {
    const savedLembrar = localStorage.getItem('saved_lembrar') === 'true';
    const savedCodigo = localStorage.getItem('saved_codigo');
    const savedSenha = localStorage.getItem('saved_senha');
    const savedCnpj = localStorage.getItem('cnpj');

    if (savedLembrar && savedCodigo) {
      setLembrar(true);
      setCredentials({
        codigo: savedCodigo,
        senha: savedSenha || '',
        cnpj: savedCnpj,
      });
    }
  }, []);

  // Salvar ou remover credenciais
  const saveCredentials = (nome: string, senha: string, cnpj: string) => {
    if (lembrar) {
      localStorage.setItem('saved_codigo', nome);
      localStorage.setItem('saved_senha', senha);
      localStorage.setItem('saved_lembrar', 'true');
      localStorage.setItem('cnpj', cnpj);
    }
  };

  const clearCredentials = () => {
    localStorage.removeItem('saved_codigo');
    localStorage.removeItem('saved_senha');
    localStorage.removeItem('saved_lembrar');
  };

  const toggleLembrar = (checked: boolean) => {
    setLembrar(checked);
    if (!checked) {
      clearCredentials();
    }
  };

  return {
    lembrar,
    credentials,
    setCredentials,
    saveCredentials,
    toggleLembrar,
    clearCredentials,
  };
};
