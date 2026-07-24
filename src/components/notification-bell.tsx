"use client";

import { useState } from "react";
import Link from "next/link";
import { markAllNotificationsRead } from "@/app/notificaciones/actions";

interface NotificationItem {
  id: string;
  message: string;
  link: string | null;
  read: boolean;
  createdAt: string;
}

export function NotificationBell({ notifications }: { notifications: NotificationItem[] }) {
  const [open, setOpen] = useState(false);
  const unread = notifications.filter((n) => !n.read).length;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative p-1.5 text-chalk hover:text-red transition-colors"
        aria-label="Notificaciones"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-red text-chalk text-[10px] leading-none rounded-full h-4 w-4 flex items-center justify-center">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <>
          <button className="fixed inset-0 z-40 cursor-default" onClick={() => setOpen(false)} aria-label="Cerrar" />
          <div className="absolute right-0 top-full mt-2 w-80 max-h-96 overflow-y-auto bg-surface text-fg border border-fg/10 shadow-lg z-50">
            <div className="flex items-center justify-between px-4 py-3 border-b border-fg/10">
              <p className="font-display text-sm tracking-wide">Notificaciones</p>
              {unread > 0 && (
                <form
                  action={async () => {
                    await markAllNotificationsRead();
                  }}
                >
                  <button className="text-xs text-fg/50 hover:text-fg">Marcar leídas</button>
                </form>
              )}
            </div>
            {notifications.length === 0 ? (
              <p className="text-sm text-fg/60 px-4 py-6 text-center">Sin notificaciones todavía.</p>
            ) : (
              <ul>
                {notifications.map((n) => {
                  const content = (
                    <div className={`px-4 py-3 border-b border-fg/10 last:border-b-0 ${!n.read ? "bg-red/5" : ""}`}>
                      <p className="text-sm">{n.message}</p>
                      <p className="text-xs text-fg/40 mt-0.5">
                        {new Date(n.createdAt).toLocaleString("es-MX")}
                      </p>
                    </div>
                  );
                  return (
                    <li key={n.id}>
                      {n.link ? (
                        <Link href={n.link} onClick={() => setOpen(false)} className="block hover:bg-surface-alt transition-colors">
                          {content}
                        </Link>
                      ) : (
                        content
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
}
