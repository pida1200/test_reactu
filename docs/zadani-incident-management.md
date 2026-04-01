# Zadání: Aplikace na incident management

> **Jak doplňovat:** Nahraď všechny zástupné texty v hranatých závorkách `[DOPLNIT: …]` nebo podtržítka `___` vlastními hodnotami. Sekce označené jako *volitelné* můžeš smazat nebo nechat prázdné.

---

## 1. Cíl a rozsah

**Cíl:** Webová aplikace pro **správu incidentů** (závažných událostí v IT službách): evidence, prioritizace, řešení, komunikace a reporting. Aplikace slouží týmům (support, operations, vývoj) a vedení.

**Organizace / kontext:** [DOPLNIT: název firmy nebo týmu, pro koho je systém]

**Mimo rozsah (první verze):** [DOPLNIT: např. integrace PagerDuty, automatické incidenty z alertů]

**Mimo rozsah (dlouhodobě mimo projekt):** [DOPLNIT: nebo „není stanoveno“]

---

## 2. Uživatelé a role

| Role        | Oprávnění (stručně) |
| ----------- | ------------------- |
| Zadavatel   | Zadává incidenty; má přehled svých zadaných incidentů |
| Řešitel     | Řeší přiřazené incidenty a mění stavy |
| Admin       | Může všechno |
| Čtenář      | [DOPLNIT nebo „nepoužívá se“] |

**Přihlášení:** uživatel zadá **přezdívku** a vybere **roli** (Zadavatel, Řešitel, Admin, příp. Čtenář). Bez hesla a bez externí identity – vhodné pro MVP / vnitřní použití; později lze doplnit plnou autentizaci (např. e-mail, SSO).

**Odhad počtu uživatelů:** cca 100

*(Pozn.: role **Zadavatel** = uživatel v systému; v sekci 9 jde o **zadavatele zadání** jako kontaktní osobu projektu.)*

---

## 3. Základní pojmy

- **Incident** – [DOPLNIT: vlastní definice v kontextu organizace]
- **Aplikace** – u každého incidentu povinný výběr z **číselníku aplikací** s hodnotami **1–10** (v první verzi pevný seznam; popisky k číslům 1–10 lze [DOPLNIT: např. názvy systémů] nebo zobrazovat jen čísla)
- **Priorita / závažnost** – [DOPLNIT: např. P1–P4 nebo Kritická / Vysoká / Střední / Nízká]
- **Stavy workflow** – výčet k doladění přechodů v odstavci „Povolené přechody“:
  - nový  
  - řešený  
  - vrácení k doplnění  
  - vyřešený  
  - předaný na jiné oddělení  
  - ukončený
- **SLA** – [DOPLNIT: co přesně měříme – první reakce, čas do vyřešení, obojí]

**Povolené přechody mezi stavy:** [DOPLNIT: tabulka nebo odrážky, co z čeho smí přejít]

---

## 4. Funkční požadavky

### 4.1 Evidence incidentů

- Povinná pole při vytvoření: název, popis, priorita, **aplikace (výběr z číselníku 1–10)**; dále [DOPLNIT: např. přiřazení, termín, …]
- Volitelná pole: [DOPLNIT]
- Formát **čísla incidentu:** [DOPLNIT: např. `INC-YYYY-NNNNN`]
- **Číselník aplikací:** hodnoty **1–10** (jedna vybraná aplikace na incident); popisky u čísel [DOPLNIT] nebo jen čísla v UI
- **Katalog služeb / komponent:** [DOPLNIT: ano/ne, odkud se bere seznam – nad rámec číselníku aplikací]

### 4.2 Seznam a filtry

- Filtry (zaškrtni nebo doplň):  
  - [ ] stav  
  - [ ] priorita  
  - [x] aplikace (1–10)  
  - [ ] přiřazený  
  - [ ] datum vytvoření  
  - [ ] fulltext v názvu/popisu  
  - [DOPLNIT další]

### 4.3 Workflow

- Kdo smí měnit stav: [DOPLNIT – typicky Řešitel a Admin; Zadavatel jen u vybraných přechodů?]
- Povinné poznámky při uzavření: [DOPLNIT: root cause, řešení, ano/ne]

### 4.4 Komentáře

- [DOPLNIT: pouze interní / rozlišení interní vs. zákazník]

### 4.5 SLA

| Priorita | Cíl na první reakci | Cíl na vyřešení | Poznámka |
| -------- | ------------------- | --------------- | -------- |
| [DOPLNIT] | [DOPLNIT] | [DOPLNIT] | |
| … | … | … | |

- Chování při **změně priority** u otevřeného incidentu: [DOPLNIT: přepočet SLA ano/ne]

### 4.6 Notifikace (MVP)

- [DOPLNIT: e-mail / pouze v aplikaci / žádné v první verzi]
- Události, které mají notifikovat: [DOPLNIT]

### 4.7 Reporting a export

- Minimální přehledy: [DOPLNIT]
- Export CSV: [DOPLNIT: ano/ne]

### 4.8 Správa (admin)

- [DOPLNIT: co vše admin spravuje – uživatelé, role, kategorie, SLA šablony, …]

---

## 5. Nefunkční požadavky

- **Responzivita:** ano – rozhraní musí být **responzivní** (mobil, tablet, desktop): čitelnost, rozumné rozložení formulářů a seznamů, ovládání bez horizontálního „šoupání“ tam, kde to jde
- **Jazyk UI:** [DOPLNIT: čeština / jiné]
- **Audit:** [DOPLNIT: které akce se musí logovat]
- **Provoz / nasazení:** **Docker** (`docker compose`) – běh aplikace i databáze v kontejnerech dle repozitáře; [DOPLNIT: interní síť, produkční URL, …]

---

## 6. Architektura (doporučení)

- **Frontend:** React (Vite) – pouze UI a volání vlastního API `/api/...`
- **Backend:** Node.js (Express) – business logika, integrace, validace
- **Databáze:** PostgreSQL – perzistence
- **Externí služby** pouze z backendu, ne z prohlížeče
- **Nasazení:** Docker Compose (viz pravidla projektu)

*Úpravy podle vašeho stacku:* [DOPLNIT nebo nechat prázdné]

---

## 7. MVP vs. další fáze

**MVP (musí být v první verzi):**  
- Přihlášení přezdívkou + výběr role  
- Evidence incidentů včetně **číselníku aplikací 1–10**  
- **Responzivní** UI  
- **Provoz v Dockeru** (compose)  
- [DOPLNIT další odrážky]

**Fáze 2:**  
[DOPLNIT odrážky]

**Nízká priorita / backlog:**  
[DOPLNIT odrážky]

---

## 8. Otevřené otázky

1. [DOPLNIT]
2. [DOPLNIT]
3. …

---

## 9. Kontakty a schválení

| Role v projektu | Jméno | Kontakt |
| --------------- | ----- | ------- |
| Zadavatel zadání | [DOPLNIT] | |
| Produkt / owner | [DOPLNIT] | |

**Datum poslední úpravy zadání:** [DOPLNIT]

**Verze dokumentu:** [DOPLNIT: např. 0.1]
