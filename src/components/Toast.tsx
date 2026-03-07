import { useUI } from '@/context/UIContext';

function Toast() {
  const { toasts } = useUI();
  if (toasts.length === 0) return null;

  return (
    <>
      {toasts.map(t => (
        <div key={t.id} className="toast visible">
          {t.message}
        </div>
      ))}
    </>
  );
}

export default Toast;
