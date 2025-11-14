#!/usr/bin/env python3
"""Enable SMTP AUTH for the tenant and a specific mailbox via Graph."""

import os
import sys

try:
    import requests
except ImportError:
    sys.exit("requests module required (pip install requests)")

SMTP_USER = os.environ.get("SMTP_USER")
if not SMTP_USER:
    sys.exit("SMTP_USER must be set (via .smtp.env or environment)")

print(f"--> Enabling tenant-wide SMTP AUTH via Graph")
tenant_resp = requests.patch(
    "https://graph.microsoft.com/v1.0/admin/exchange/settings",
    headers={
        "Authorization": f"Bearer {os.environ.get('AZURE_ACCESS_TOKEN', '')}",
        "Content-Type": "application/json",
    },
    json={"smtpClientAuthenticationDisabled": False},
    timeout=15,
)
if tenant_resp.status_code >= 400:
    print("Impossible de modifier la configuration tenant :", tenant_resp.text)
else:
    print("Tenant SMTP auth activé (ou déjà actif)")

print(f"--> Enabling SMTP AUTH for mailbox {SMTP_USER}")
mailbox_resp = requests.patch(
    f"https://graph.microsoft.com/v1.0/users/{SMTP_USER}",
    headers={
        "Authorization": f"Bearer {os.environ.get('AZURE_ACCESS_TOKEN', '')}",
        "Content-Type": "application/json",
    },
    json={"smtpClientAuthenticationDisabled": False},
    timeout=15,
)
if mailbox_resp.status_code >= 400:
    sys.exit("Impossible de modifier la boîte : " + mailbox_resp.text)

print("SMTP AUTH activé pour", SMTP_USER)
