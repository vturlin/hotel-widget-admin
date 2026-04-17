"""
Hotel Widget Config Admin
-------------------------
Streamlit app to create JSON configs for the hotel price widget,
with a live preview (iframe) and direct publish to the GitHub repo.
"""

import streamlit as st
import json
import base64
import secrets
import string
import requests
from urllib.parse import quote

# =============================================================================
# Configuration — comes from Streamlit Secrets in production
# =============================================================================

# In Streamlit Cloud: Settings → Secrets → add these keys
#   ADMIN_PASSWORD = "your-password"
#   GITHUB_TOKEN = "ghp_xxx..."
#   GITHUB_OWNER = "vturlin"
#   GITHUB_REPO = "best-price-widget"
#   GITHUB_BRANCH = "main"
#   WIDGET_PREVIEW_URL = "https://vturlin.github.io/best-price-widget/demo.html"

def get_secret(key, default=None):
    """Safe secret getter — falls back to default if not in Streamlit secrets."""
    try:
        return st.secrets[key]
    except (KeyError, FileNotFoundError):
        return default

ADMIN_PASSWORD      = get_secret("ADMIN_PASSWORD", "changeme")
GITHUB_TOKEN        = get_secret("GITHUB_TOKEN")
GITHUB_OWNER        = get_secret("GITHUB_OWNER", "vturlin")
GITHUB_REPO         = get_secret("GITHUB_REPO", "best-price-widget")
GITHUB_BRANCH       = get_secret("GITHUB_BRANCH", "main")
WIDGET_PREVIEW_URL  = get_secret(
    "WIDGET_PREVIEW_URL",
    "https://vturlin.github.io/best-price-widget/demo.html"
)

# =============================================================================
# i18n: the 20 supported locales
# =============================================================================

SUPPORTED_LOCALES = {
    "en": "English",
    "fr": "Français",
    "es": "Español",
    "de": "Deutsch",
    "it": "Italiano",
    "pt": "Português",
    "nl": "Nederlands",
    "pl": "Polski",
    "ru": "Русский",
    "cs": "Čeština",
    "sv": "Svenska",
    "da": "Dansk",
    "no": "Norsk",
    "fi": "Suomi",
    "el": "Ελληνικά",
    "tr": "Türkçe",
    "zh": "中文",
    "ja": "日本語",
    "ko": "한국어",
    "ar": "العربية",
}

SUPPORTED_CURRENCIES = ["EUR", "USD", "GBP", "CHF", "CAD", "AUD", "JPY", "CNY"]

POSITIONS = {
    "bottom-right": "Bottom right",
    "bottom-left": "Bottom left",
    "center-right": "Center right",
    "center-left": "Center left",
}

# =============================================================================
# Utilities
# =============================================================================

def generate_hotel_id():
    """Generate a short, unique hotel ID like 'hm_a1b2c3d4'."""
    alphabet = string.ascii_lowercase + string.digits
    suffix = "".join(secrets.choice(alphabet) for _ in range(8))
    return f"hm_{suffix}"


def build_config(form):
    """Build the JSON config from the form state."""
    return {
        "position": form["position"],
        "csvUrl": form["csv_url"],
        "roomOptions": form["rooms"],
        "default_room_id": form["default_room_id"],
        "reserveUrl": form["reserve_url"],
        "currency": form["currency"],
        "locale": "",
        "brandColor": form["brand_color"],
        "backgroundColor": form["background_color"],
        "logoUrl": form["logo_url"],
        "hotelName": form["hotel_name"],
        "enabledLocales": form["enabled_locales"],
        "defaultLocale": form["default_locale"],
        "channelLabels": form["channel_labels"],
        "analytics": {
            "enabled": form["analytics_enabled"],
            "dataLayerName": form["datalayer_name"],
            "eventPrefix": form["event_prefix"],
        },
    }


def build_preview_url(config):
    """
    Build a preview URL: widget demo page with the config passed via a
    base64-encoded query param. This lets the preview iframe render the
    real widget with the current form values, without needing to publish.
    """
    encoded = base64.urlsafe_b64encode(
        json.dumps(config).encode("utf-8")
    ).decode("ascii").rstrip("=")
    return f"{WIDGET_PREVIEW_URL}?preview={encoded}"


def publish_to_github(hotel_id, config):
    """
    Create or update public/configs/{hotel_id}.json in the widget repo.
    Uses the GitHub Contents API.
    """
    if not GITHUB_TOKEN:
        raise RuntimeError(
            "No GITHUB_TOKEN configured. Add it to Streamlit Secrets."
        )

    path = f"public/configs/{hotel_id}.json"
    api_url = f"https://api.github.com/repos/{GITHUB_OWNER}/{GITHUB_REPO}/contents/{quote(path)}"

    headers = {
        "Authorization": f"Bearer {GITHUB_TOKEN}",
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
    }

    # First, see if the file already exists — we need its SHA to update
    existing = requests.get(api_url, headers=headers, params={"ref": GITHUB_BRANCH})
    sha = existing.json().get("sha") if existing.status_code == 200 else None

    content_b64 = base64.b64encode(
        json.dumps(config, indent=2, ensure_ascii=False).encode("utf-8")
    ).decode("ascii")

    payload = {
        "message": f"config: {'update' if sha else 'create'} {hotel_id}",
        "content": content_b64,
        "branch": GITHUB_BRANCH,
    }
    if sha:
        payload["sha"] = sha

    response = requests.put(api_url, headers=headers, json=payload)
    response.raise_for_status()
    return response.json()


# =============================================================================
# Auth gate
# =============================================================================

def check_password():
    """Simple password gate. Sets st.session_state.authed on success."""
    if st.session_state.get("authed"):
        return True

    st.title("🔐 Hotel Widget Admin")
    st.caption("Enter the admin password to continue.")
    pwd = st.text_input("Password", type="password", key="pwd_input")
    if st.button("Log in"):
        if pwd == ADMIN_PASSWORD:
            st.session_state.authed = True
            st.rerun()
        else:
            st.error("Wrong password.")
    return False


# =============================================================================
# Main UI
# =============================================================================

def main():
    st.set_page_config(
        page_title="Hotel Widget Admin",
        page_icon="🏨",
        layout="wide",
    )

    if not check_password():
        return

    st.title("🏨 Hotel Widget — Config Manager")
    st.caption(
        "Create a config for a new hotel. "
        "The form generates a JSON that will be published to GitHub."
    )

    # -------- Layout: form on the left, preview on the right -----------------
    left, right = st.columns([5, 4])

    # -------- Left column: the form ------------------------------------------
    with left:
        # ----- Identification -----
        st.subheader("🆔 Identification")

        if "hotel_id" not in st.session_state:
            st.session_state.hotel_id = generate_hotel_id()

        id_col1, id_col2 = st.columns([3, 1])
        with id_col1:
            hotel_id = st.text_input(
                "Hotel ID",
                value=st.session_state.hotel_id,
                help="Unique identifier. Used in the script tag: widget.js?id=...",
            )
        with id_col2:
            st.write("")  # spacer
            if st.button("🎲 Regenerate"):
                st.session_state.hotel_id = generate_hotel_id()
                st.rerun()

        hotel_name = st.text_input("Hotel name", value="Hôtel Demo")
        hotel_domain = st.text_input(
            "Client domain",
            value="hotel-client.com",
            help="Not used by the widget yet — stored for reference.",
        )

        # ----- Data source -----
        st.subheader("📊 Data source")
        csv_url = st.text_input(
            "Google Sheet CSV URL",
            value="https://docs.google.com/spreadsheets/d/e/.../pub?output=csv",
            help="Google Sheet published as CSV.",
        )

        st.markdown("**Rooms**")
        rooms_text = st.text_area(
            "One room per line, format: id | name",
            value="deluxe-king | Deluxe King Room\n"
                  "superior-twin | Superior Twin Room\n"
                  "junior-suite | Junior Suite",
            height=100,
        )
        rooms = []
        for line in rooms_text.strip().split("\n"):
            if "|" in line:
                rid, rname = line.split("|", 1)
                rooms.append({"id": rid.strip(), "name": rname.strip()})

        if rooms:
            default_room_id = st.selectbox(
                "Default room",
                [r["id"] for r in rooms],
                format_func=lambda rid: next(
                    (r["name"] for r in rooms if r["id"] == rid), rid
                ),
            )
        else:
            default_room_id = ""
            st.warning("Add at least one room above.")

        # ----- Booking -----
        st.subheader("🔗 Booking engine")
        reserve_url = st.text_input(
            "Reserve URL",
            value="https://book.hotel-client.com/?arrive={checkIn}&depart={checkOut}&room={roomId}",
            help="Use {checkIn}, {checkOut}, {roomId} as placeholders.",
        )

        # ----- Appearance -----
        st.subheader("🎨 Appearance")
        app_col1, app_col2 = st.columns(2)
        with app_col1:
            brand_color = st.color_picker("Brand color (buttons)", "#8b5a3c")
        with app_col2:
            background_color = st.color_picker("Background color (panel)", "#faf7f2")
        position = st.selectbox(
            "Position",
            list(POSITIONS.keys()),
            format_func=lambda p: POSITIONS[p],
        )
        logo_url = st.text_input("Logo URL (optional)", value="")

        # ----- i18n -----
        st.subheader("🌍 Languages & currency")
        enabled_locales = st.multiselect(
            "Enabled languages",
            list(SUPPORTED_LOCALES.keys()),
            default=["en", "fr", "es", "de", "it"],
            format_func=lambda l: f"{l} — {SUPPORTED_LOCALES[l]}",
        )
        default_locale = st.selectbox(
            "Default language",
            enabled_locales or ["en"],
            format_func=lambda l: f"{l} — {SUPPORTED_LOCALES.get(l, l)}",
        )
        currency = st.selectbox("Default currency", SUPPORTED_CURRENCIES)

        # ----- OTA labels -----
        st.subheader("🏷️ OTA labels")
        st.caption("Shown in the comparison list.")
        ota_col1, ota_col2 = st.columns(2)
        with ota_col1:
            booking_label = st.text_input("Booking.com", value="Booking.com")
            expedia_label = st.text_input("Expedia", value="Expedia")
            trivago_label = st.text_input("Trivago", value="Trivago")
        with ota_col2:
            hotels_com_label = st.text_input("Hotels.com", value="Hotels.com")
            agoda_label = st.text_input("Agoda", value="Agoda")

        channel_labels = {
            "booking": booking_label,
            "expedia": expedia_label,
            "trivago": trivago_label,
            "hotels_com": hotels_com_label,
            "agoda": agoda_label,
        }

        # ----- Analytics -----
        st.subheader("📈 Analytics")
        analytics_enabled = st.toggle("Enable dataLayer push", value=True)
        if analytics_enabled:
            datalayer_name = st.text_input(
                "dataLayer variable name",
                value="dataLayer",
                help="GTM-compatible. Leave 'dataLayer' unless the host site uses a different name.",
            )
            event_prefix = st.text_input(
                "Event prefix",
                value="hotel_widget_",
                help="All events will be prefixed with this. E.g. 'hotel_widget_opened'.",
            )
        else:
            datalayer_name = "dataLayer"
            event_prefix = "hotel_widget_"

    # -------- Right column: preview + publish --------------------------------
    form = {
        "hotel_id": hotel_id,
        "hotel_name": hotel_name,
        "hotel_domain": hotel_domain,
        "csv_url": csv_url,
        "rooms": rooms,
        "default_room_id": default_room_id,
        "reserve_url": reserve_url,
        "currency": currency,
        "position": position,
        "brand_color": brand_color,
        "background_color": background_color,
        "logo_url": logo_url,
        "enabled_locales": enabled_locales,
        "default_locale": default_locale,
        "channel_labels": channel_labels,
        "analytics_enabled": analytics_enabled,
        "datalayer_name": datalayer_name,
        "event_prefix": event_prefix,
    }

    config = build_config(form)

    with right:
        st.subheader("👀 Live preview")
        preview_url = build_preview_url(config)
        st.components.v1.iframe(preview_url, height=600, scrolling=True)

        st.subheader("📄 Generated JSON")
        st.code(json.dumps(config, indent=2, ensure_ascii=False), language="json")

        st.download_button(
            "⬇️ Download JSON",
            data=json.dumps(config, indent=2, ensure_ascii=False),
            file_name=f"{hotel_id}.json",
            mime="application/json",
        )

        st.subheader("🚀 Publish to GitHub")
        if not GITHUB_TOKEN:
            st.error(
                "GITHUB_TOKEN is not configured. "
                "Add it to Streamlit Secrets to enable publishing."
            )
        else:
            if st.button("Publish config to repo", type="primary"):
                try:
                    with st.spinner("Publishing..."):
                        result = publish_to_github(hotel_id, config)
                    st.success(
                        f"✅ Published! Commit SHA: `{result['commit']['sha'][:7]}`"
                    )
                    st.caption(
                        f"Available in ~1–2 min at `configs/{hotel_id}.json` "
                        f"once GitHub Actions finishes deploying."
                    )
                    st.markdown(
                        f"**Embed code:** \n"
                        f"```html\n"
                        f'<script async '
                        f'src="https://{GITHUB_OWNER}.github.io/{GITHUB_REPO}/'
                        f'widget.js?id={hotel_id}"></script>\n'
                        f"```"
                    )
                except Exception as e:
                    st.error(f"Publish failed: {e}")


if __name__ == "__main__":
    main()