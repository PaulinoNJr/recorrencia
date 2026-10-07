"use client";
import { ReactNode, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Check,
  Minus,
  Plus,
  X,
  ArrowRight,
  LockKeyhole,
  Repeat2,
} from "lucide-react";
import { Status, SubscriptionItem } from "@/types";
import { dateLabel, money, total } from "@/lib/utils";
export function Button({
  children,
  onClick,
  variant = "primary",
  disabled = false,
  type = "button",
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "danger" | "text";
  disabled?: boolean;
  type?: "button" | "submit";
}) {
  return (
    <button
      type={type}
      className={"btn " + variant}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
export function Badge({ status }: { status: Status }) {
  return (
    <span
      className={
        "badge " +
        {
          Ativa: "active",
          Pausada: "paused",
          "Pagamento recusado": "failed",
          Cancelada: "canceled",
        }[status]
      }
    >
      <span /> {status}
    </span>
  );
}
export function Quantity({
  value,
  onChange,
  max = 99,
}: {
  value: number;
  onChange: (v: number) => void;
  max?: number;
}) {
  return (
    <div className="quantity">
      <button
        aria-label="Diminuir quantidade"
        disabled={value <= 1}
        onClick={() => onChange(value - 1)}
      >
        <Minus size={14} />
      </button>
      <output aria-label="Quantidade">{value}</output>
      <button
        aria-label="Aumentar quantidade"
        disabled={value >= max}
        onClick={() => onChange(value + 1)}
      >
        <Plus size={14} />
      </button>
    </div>
  );
}
export function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const prev = document.activeElement as HTMLElement;
    const dialog = ref.current;
    dialog?.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      dialog?.close();
      document.body.style.overflow = "";
      prev?.focus();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className="modal"
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
    >
      <div className="modal-heading">
        <h2>{title}</h2>
        <button aria-label="Fechar" onClick={onClose}>
          <X />
        </button>
      </div>
      {children}
    </dialog>
  );
}
const steps = [
  ["Produtos", "configurar"],
  ["Entrega", "entrega"],
  ["Pagamento", "pagamento"],
  ["Revisão", "revisao"],
];
export function CheckoutStepper({ active }: { active: number }) {
  return (
    <div className="checkout-steps" aria-label="Etapas da assinatura">
      {steps.map(([label, route], i) => (
        <div
          key={label}
          className={i === active ? "current" : i < active ? "complete" : ""}
        >
          {i < active ? (
            <Link href={"/assinatura/" + route}>
              <span>
                <Check size={16} />
              </span>
              {label}
            </Link>
          ) : (
            <>
              <span>{i + 1}</span>
              <strong>{label}</strong>
            </>
          )}
          {i < 3 && <i />}
        </div>
      ))}
    </div>
  );
}
export function Summary({
  items,
  date,
  children,
  cart = false,
}: {
  items: SubscriptionItem[];
  date?: string;
  children?: ReactNode;
  cart?: boolean;
}) {
  const subtotal = total(items);
  return (
    <aside className="summary panel">
      <h2>{cart ? "Resumo do pedido" : "Sua assinatura"}</h2>
      <div className="summary-row">
        <span>{cart ? "Produtos" : "Produtos recorrentes"}</span>
        <strong>{items.length}</strong>
      </div>
      <div className="summary-row">
        <span>Subtotal</span>
        <strong>{money(subtotal)}</strong>
      </div>
      <div className="summary-row">
        <span>Entrega</span>
        <strong>{money(9.9)}</strong>
      </div>
      <div className="summary-total">
        <span>
          {cart ? "Total estimado" : "Estimativa da próxima cobrança"}
          <b>{money(subtotal + 9.9)}</b>
        </span>
      </div>
      {date && (
        <div className="next-delivery">
          <Repeat2 size={19} />
          <span>
            Próxima entrega prevista<strong>{dateLabel(date)}</strong>
          </span>
        </div>
      )}
      {children}
      <p className="summary-note">
        {cart
          ? "Você confere todos os detalhes antes de confirmar."
          : "Os valores podem variar conforme preços e disponibilidade em cada ciclo."}
      </p>
      <div className="secure">
        <LockKeyhole size={14} />
        Seus dados estão protegidos
      </div>
    </aside>
  );
}
export function PageHeading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="page-heading">
      <div>
        {eyebrow && <div className="eyebrow">{eyebrow}</div>}
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {action}
    </div>
  );
}
export function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="panel empty">
      <Repeat2 size={40} />
      <h2>{title}</h2>
      <p>{description}</p>
      <Link className="btn primary" href="/carrinho">
        Ir para o carrinho <ArrowRight size={17} />
      </Link>
    </div>
  );
}
