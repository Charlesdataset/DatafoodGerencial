import {
  faCircleCheck,
  faCircleInfo,
  faClose,
  faEye,
  faInfoCircle,
  faTriangleExclamation
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import dayjs from 'dayjs';

import { useRef, useState } from 'react';

import { toast } from 'react-toastify';
import { api } from '../../services/api';
import Spinner from '../Spinner/Spinner';
import CustomStyle from './MessageBox.module.scss';

const iconTypes = {
  warning: faTriangleExclamation,
  info: faCircleInfo
};

export default function MessageBox({
  isOpen,
  data = {
    type: 'info',
    title: '',
    message: '',
    warning: false,
    cancelText: "",
    confirmText:"",
    width: '320px',
    lockedOperation: false,
    operations: [
      {
        type: 'api',
        apiRoute: `test`,
        query: [],
        data: {},
        apiOperationType: 'put',
        successMessage: 'teste',
        notFoundError: 'Recusrso não encontrado',
        loadingMessage: 'teste...'
      }
    ]
  },
  onClose,
  onConfirm
}) {
  if (!isOpen) return null;

  const [shakeBox, setShakeBox] = useState(false);
  const [validationMessage, setValidationMessage] = useState('');
  const [password, setPassword] = useState('');
  const [passwordBoxVisible, setPasswordVisible] = useState(true);
  const [lastPassword, setLastPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Carregando...');
  const [stepStarting, setStepStartig] = useState(false);
  const [stepMessage, setStepMessage] = useState('');
  const [stepCompleted, setStepCompleted] = useState(false);

  const abortSignalRef = useRef(null);

  const handleAuthorize = async () => {
    try {
      setIsLoading(true);
      setLoadingMessage('Autentificando...');
      setLastPassword(password);
      const result = await api.get(`authorize-adm?currDate=${dayjs()}&password=${password}`, {
        headers: { 'x-access-token': localStorage.getItem('tokenTicket') }
      });
      if (result?.status == 200) {
        setLoadingMessage('Sucesso...');
        await new Promise(resolve => setTimeout(resolve, 500));
        setIsLoading(false);
        setPasswordVisible(false);
        return true;
      }  setValidationMessage('Falha em autentificar tente novamente!');
      setShakeBox(true);
      setIsLoading(false);
      return false;
      
    }
    catch(error:any) {
      setValidationMessage('Falha em autentificar tente novamente!');
      setShakeBox(true);
      setIsLoading(false);
      return false;
    }
   
  };

  const requestAnimation = () => {
    setShakeBox(false);
    requestAnimationFrame(() => setShakeBox(true));
  };
  const handleClick = async () => {
    try {
      if (password == '') {
        requestAnimation();
        return false;
      }
      if (lastPassword == password) {
        requestAnimation();
        return;
      }
      const autenticado = await handleAuthorize();
      if (!autenticado) return;

      const controller = new AbortController();
      abortSignalRef.current = controller;
      const signal = controller.signal;

      for (const op of data.operations) {
        let response = null;

        setStepStartig(true);
        setStepMessage(op.loadingMessage);

        switch (op.apiOperationType) {
          case 'put':
            response = await api.put(`${op.apiRoute}?${op.query}`, op.data, {
              signal,
              headers: {
                'x-access-token': localStorage.getItem('tokenTicket')
              }
            });
            break;
        }

        if (response == null) {
          if (signal.aborted) return false;
          toast.info('forneça um tipo de metodo http');
          return false;
        }
        if (response?.status == 200) {
          setStepCompleted(true);
          setStepMessage('Sucesso');
          await new Promise(resolve => setTimeout(resolve, 2000));

          toast.success(op.successMessage);
          return true;
        } else if (response?.status == 204) {
          toast.info(op.notFoundError);
        }
        return false;
      }
    } catch (error) {
      toast.error(error?.message ?? 'Ocorreu um erro ao executar a operação!');

      setStepStartig(false);
      setPasswordVisible(true);
      setLastPassword('');
      return false;
    }
  };

  return (
    <>
      {true && (
        <div className={CustomStyle.backdrop}>
          <div
            className={CustomStyle.card}
            style={{
              '--width': `${data.width}`
            } as any}
          >
            <div
              className={CustomStyle.cardTop}
              onClick={e => {
                onClose('close'); // ← MUDANÇA: X da área superior também retorna 'close'
              }}
            >
              <div className="d-flex gap-2 align-content-center">
                <FontAwesomeIcon
                  icon={faTriangleExclamation}
                  className={CustomStyle.cardTopIcon}
                  style={{
                    '--danger': '#df456c'
                  } as any}
                />
                <h5 className={CustomStyle.cardTopTitle}>{data.title}</h5>
              </div>

              <FontAwesomeIcon
                icon={faClose}
                className={CustomStyle.cardCloseIcon}
                onClick={e => {
                  onClose('close'); // ← MUDANÇA: X do canto retorna 'close'
                }}
              />
            </div>

            <div className={CustomStyle.cardMain}>
              {!isLoading && !stepStarting && <p className={CustomStyle.mainText}>{data.message}</p>}
              {data.warning && !isLoading && !stepStarting && (
                <span style={{ fontWeight: '600' }}>Esta operação não poderá ser desfeita!</span>
              )}
              {data.lockedOperation && !isLoading && passwordBoxVisible && (
                <div className={CustomStyle.passwordGroup}>
                  <label className={CustomStyle.passwordLabel}>Senha:</label>
                  <input
                    type="password"
                    value={password}
                    onChange={e => {
                      setValidationMessage('');
                      setPassword(e.target.value);
                    }}
                    className={`${CustomStyle.passwordInput} ${shakeBox ? CustomStyle.shakeAnimation : ''}`}
                  ></input>
                  <FontAwesomeIcon
                    icon={faEye}
                    className={`${CustomStyle.passwordIcon} ${shakeBox ? CustomStyle.shakeAnimation : ''}`}
                  />
                  {((shakeBox && password == '') || (shakeBox && validationMessage != '')) && (
                    <div
                      className={`${CustomStyle.passwordInfo} ${
                        validationMessage != '' ? CustomStyle.setWarningColor : ''
                      }`}
                    >
                      <FontAwesomeIcon
                        className={`${CustomStyle.paswordInfoIcon} ${
                          validationMessage != '' ? CustomStyle.setWarningColor : ''
                        }`}
                        icon={faInfoCircle}
                      />
                      <p
                        className={`${CustomStyle.passwordInfoLabel} ${
                          validationMessage != '' ? CustomStyle.setWarningColor : ''
                        }`}
                      >
                        {validationMessage || 'Forneça a senha para continuar'}
                      </p>
                    </div>
                  )}
                </div>
              )}
              {isLoading && (
                <div>
                  <Spinner />
                  <h6>{loadingMessage}</h6>
                </div>
              )}
              {stepStarting && (
                <div className="d-flex gap-2 align-items-center">
                  {stepCompleted ? (
                    <FontAwesomeIcon style={{ color: 'var(--falcon-primary)' }} icon={faCircleCheck} />
                  ) : (
                    <Spinner variant='grow' />
                  )}

                  <h5 className="mb-0" style={stepCompleted ? { color: 'var(--falcon-primary)' } : {}}>
                    {stepMessage}
                  </h5>
                </div>
              )}
            </div>
            <div className={CustomStyle.cardBottom}>
              <button
                className={CustomStyle.buttonCancell}
                onClick={e => {
                  if (abortSignalRef.current != null) abortSignalRef.current.abort();
                  onClose('cancel'); // ← MUDANÇA: Botão Cancelar retorna 'cancel'
                }}
              >
                {data.cancelText || 'Cancelar'}
              </button>
              <button
                className={CustomStyle.buttonAccept}
                onClick={async e => {
                  if (!data.lockedOperation) {
                    onConfirm('confirm'); // ← MUDANÇA: Botão Confirmar retorna 'confirm'
                    onClose('confirm'); // ← MUDANÇA: Fecha com 'confirm'
                  } else {
                    const result = await handleClick();
                    if (result) {
                      onConfirm('confirm'); // ← MUDANÇA: Botão Confirmar retorna 'confirm'
                      onClose('confirm'); // ← MUDANÇA: Fecha com 'confirm'
                    }
                  }
                }}
              >
                {data.confirmText || 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
