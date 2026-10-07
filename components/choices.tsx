"use client";
import { useState } from "react";
import { MapPin, Plus, CreditCard, Check } from "lucide-react";
import { useStore } from "./store";
import { Button, Modal } from "./ui";
export function AddressChoices({
  value,
  onChange,
}: {
  value: string;
  onChange: (id: string) => void;
}) {
  const { state, setState, notify } = useStore();
  const [open, setOpen] = useState(false);
  return (
    <>
      <div className="choice-grid">
        {state.addresses.map((a) => (
          <button
            key={a.id}
            className={"choice panel " + (value === a.id ? "chosen" : "")}
            onClick={() => onChange(a.id)}
          >
            <MapPin />
            <span>
              <strong>{a.label}</strong>
              <p>{a.street}</p>
              <p>
                {a.city} · CEP {a.zip}
              </p>
            </span>
            <span className="radio">
              {value === a.id && <Check size={12} />}
            </span>
          </button>
        ))}
      </div>
      <button className="text-action" onClick={() => setOpen(true)}>
        <Plus size={17} />
        Adicionar outro endereço
      </button>
      {open && (
        <Modal title="Adicionar endereço" onClose={() => setOpen(false)}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const data = new FormData(e.currentTarget);
              const id = "address-" + Date.now();
              setState((s) => ({
                ...s,
                addresses: [
                  ...s.addresses,
                  {
                    id,
                    label: String(data.get("label")),
                    street: String(data.get("street")),
                    city: String(data.get("city")),
                    zip: String(data.get("zip")),
                  },
                ],
              }));
              onChange(id);
              setOpen(false);
              notify("Endereço adicionado.");
            }}
          >
            <div className="form-fields">
              <label>
                Nome do endereço
                <input name="label" required placeholder="Ex.: Casa" />
              </label>
              <label>
                Rua, número e bairro
                <input name="street" required />
              </label>
              <label>
                Cidade e estado
                <input name="city" required />
              </label>
              <label>
                CEP
                <input
                  name="zip"
                  required
                  pattern="[0-9]{5}-?[0-9]{3}"
                  placeholder="13170-000"
                />
              </label>
            </div>
            <Button type="submit">Salvar endereço</Button>
          </form>
        </Modal>
      )}
    </>
  );
}
export function PaymentChoices({
  value,
  onChange,
}: {
  value: string;
  onChange: (id: string) => void;
}) {
  const { state, setState, notify } = useStore();
  const [open, setOpen] = useState(false);
  return (
    <>
      <div className="choice-grid">
        {state.payments.map((p) => (
          <button
            className={"choice panel " + (value === p.id ? "chosen" : "")}
            key={p.id}
            onClick={() => onChange(p.id)}
          >
            <div
              className={
                "card-brand " + (p.brand === "Mastercard" ? "mastercard" : "")
              }
            >
              {p.brand === "Mastercard" ? (
                <>
                  <i />
                  <i />
                </>
              ) : (
                <CreditCard />
              )}
            </div>
            <span>
              <strong>
                {p.brand} <span className="muted">•••• {p.last4}</span>
              </strong>
              <p>{p.holder}</p>
              <p>Validade {p.expiry}</p>
            </span>
            <span className="radio">
              {value === p.id && <Check size={12} />}
            </span>
          </button>
        ))}
      </div>
      <button className="text-action" onClick={() => setOpen(true)}>
        <Plus size={17} />
        Adicionar cartão fictício
      </button>
      {open && (
        <Modal title="Adicionar cartão fictício" onClose={() => setOpen(false)}>
          <p>Selecione um cartão de demonstração. Não informe dados reais.</p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const data = new FormData(e.currentTarget);
              const id = "card-" + Date.now();
              setState((s) => ({
                ...s,
                payments: [
                  ...s.payments,
                  {
                    id,
                    brand: String(data.get("brand")),
                    last4: "1234",
                    holder: "Robson Ferreira",
                    expiry: "12/30",
                  },
                ],
              }));
              onChange(id);
              setOpen(false);
              notify("Cartão fictício adicionado.");
            }}
          >
            <label>
              Bandeira
              <select name="brand">
                <option>Visa</option>
                <option>Mastercard</option>
                <option>Elo</option>
              </select>
            </label>
            <div className="notice">
              Cartão de teste · final 1234 · validade 12/30
            </div>
            <Button type="submit">Adicionar cartão</Button>
          </form>
        </Modal>
      )}
    </>
  );
}
export function DeliveryOptions({
  date,
  period,
  onChange,
}: {
  date: string;
  period: string;
  onChange: (patch: { date?: string; period?: string }) => void;
}) {
  return (
    <>
      <h3 className="section-label">Primeira entrega</h3>
      <label className="date-field">
        Selecione uma data
        <input
          aria-label="Data de entrega"
          type="date"
          min="2026-10-07"
          value={date}
          onChange={(e) => onChange({ date: e.target.value })}
          required
        />
      </label>
      <h3 className="section-label">Qual o melhor período?</h3>
      <div className="period-grid">
        {["08h às 12h", "12h às 18h", "18h às 21h"].map((p, i) => (
          <button
            key={p}
            className={"period " + (p === period ? "chosen" : "")}
            onClick={() => onChange({ period: p })}
          >
            <span>{["Manhã", "Tarde", "Noite"][i]}</span>
            <strong>{p}</strong>
          </button>
        ))}
      </div>
    </>
  );
}
