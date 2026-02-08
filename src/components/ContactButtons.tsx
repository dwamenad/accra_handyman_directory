"use client";

type Props = {
  profileId: string;
  publicPhone: string;
};

async function track(profileId: string, eventType: "WHATSAPP_CLICK" | "CALL_CLICK") {
  try {
    await fetch("/api/analytics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profileId, eventType })
    });
  } catch {
    // Do not block user contact action on tracking failure.
  }
}

export function ContactButtons({ profileId, publicPhone }: Props) {
  const normalized = publicPhone.replace(/\D/g, "");

  return (
    <div className="row">
      <a
        href={`https://wa.me/${normalized}`}
        className="btn btn-secondary"
        onClick={() => {
          void track(profileId, "WHATSAPP_CLICK");
        }}
      >
        WhatsApp
      </a>
      <a
        href={`tel:${publicPhone}`}
        className="btn"
        onClick={() => {
          void track(profileId, "CALL_CLICK");
        }}
      >
        Call
      </a>
    </div>
  );
}
