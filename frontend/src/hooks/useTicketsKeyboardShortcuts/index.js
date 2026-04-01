import { useEffect } from "react";

function isEditableTarget(el) {
  if (!el || typeof el.tagName !== "string") return false;
  const tag = el.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  if (el.isContentEditable) return true;
  return false;
}

function isInsideTicketChatPanel(el) {
  return el && el.closest && el.closest("[data-ticket-chat-panel]");
}

/** Itens da lista visíveis (ignora listas em abas/painéis com display:none). */
function getVisibleTicketListItems() {
  return Array.from(document.querySelectorAll("[data-ticket-list-item]")).filter(
    (el) => el.offsetParent !== null
  );
}

/**
 * Atalhos da coluna de Atendimentos (lista + busca).
 * Não dispara quando o foco está no painel do ticket (mensagem, inputs do chat).
 * Modais MUI (novo ticket, ações em massa) fecham com Esc pelo próprio Dialog.
 */
export function useTicketsKeyboardShortcuts({ searchInputRef, setTab }) {
  useEffect(() => {
    const onKeyDown = (e) => {
      const target = e.target;
      const inChat = isInsideTicketChatPanel(target);
      const editable = isEditableTarget(target);
      const searchEl = searchInputRef.current;

      if (e.key === "Escape") {
        if (inChat && editable) {
          e.preventDefault();
          if (typeof target.blur === "function") target.blur();
          return;
        }
        if (editable && !inChat) {
          if (typeof target.blur === "function") target.blur();
        }
        return;
      }

      if (inChat) {
        return;
      }

      if (e.key === "/" && !editable) {
        e.preventDefault();
        if (searchEl && typeof searchEl.focus === "function") {
          searchEl.focus();
        }
        return;
      }

      if (e.altKey && !e.ctrlKey && !e.metaKey && !e.shiftKey) {
        const k = e.key;
        if (k === "1" || k === "2" || k === "3" || k === "4") {
          e.preventDefault();
          if (k === "1") setTab("open");
          if (k === "2") setTab("closed");
          if (k === "3") setTab("search");
          if (k === "4") setTab("groups");
          return;
        }
      }

      if (e.key !== "ArrowDown" && e.key !== "ArrowUp") {
        return;
      }

      const items = getVisibleTicketListItems();
      if (items.length === 0) return;

      const searchFocused =
        searchEl && (target === searchEl || (searchEl.contains && searchEl.contains(target)));

      if (e.key === "ArrowDown" && searchFocused) {
        e.preventDefault();
        items[0].focus();
        return;
      }

      const row = target.closest && target.closest("[data-ticket-list-item]");
      if (!row || !items.includes(row)) {
        return;
      }

      const idx = items.indexOf(row);
      if (idx === -1) return;

      if (e.key === "ArrowDown" && idx < items.length - 1) {
        e.preventDefault();
        items[idx + 1].focus();
        return;
      }

      if (e.key === "ArrowUp") {
        if (idx === 0 && searchEl) {
          e.preventDefault();
          searchEl.focus();
          return;
        }
        if (idx > 0) {
          e.preventDefault();
          items[idx - 1].focus();
        }
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [searchInputRef, setTab]);
}

export default useTicketsKeyboardShortcuts;
