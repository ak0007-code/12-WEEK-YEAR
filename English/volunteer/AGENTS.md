# Volunteer Search and Application Instructions

## Purpose

This folder helps the user find, compare, apply for, and track volunteer opportunities in Metro Vancouver. The main goal is to practise spoken English through regular customer-facing volunteer work.

## Communication

- Use clear, plain English suitable for an English learner.
- Explain unfamiliar application questions in simple language.
- Help improve written answers while keeping them truthful and natural.
- Do not describe English improvement as the only reason for volunteering. Also emphasize community service, customer service, problem-solving, reliability, and relevant experience.

## Volunteer Preferences

### Preferred locations

1. Edmonds, Burnaby
2. Metrotown, Burnaby
3. New Westminster
4. Other locations between New Westminster and downtown Vancouver when the opportunity is a strong match

Prefer locations that are practical to reach by public transit.

### Preferred roles

- Customer service
- Reception or front desk
- Visitor services
- Information desk or wayfinding
- Cafe, coffee bar, or cashier service
- Library or community-centre support
- Greeting visitors and answering questions
- Helping people solve simple problems
- Technology or Digital Cafe support, especially helping adults or seniors use computers and smartphones

### Commitment preference

- Strongly prefer recurring volunteer work with a regular weekly shift.
- One-time events are a low priority unless they may lead to an ongoing role.
- Prefer roles with frequent conversation and direct interaction with customers, visitors, patients, adults, or seniors.
- Confirm the minimum commitment, shift schedule, and whether the position is truly ongoing before recommending it as a top choice.

### Roles to avoid or rank lower

- Do not prioritize thrift-store positions because the user already volunteers at one.
- Rank back-room roles, warehouse work, cleaning, and roles with little conversation below customer-facing positions.
- Food preparation and dishwashing are acceptable only when combined with cashier or customer-service duties.
- Avoid opportunities outside the preferred travel area unless the user requests a wider search.

## Application Status Management

- Do not record current opportunities, application status, interview status, dates, or follow-up actions directly in this file.
- Use `volunteer_applications.csv` as the only source of truth for changing volunteer and application status.
- Read the CSV before reporting the user's current status or deciding the next application task.
- Add a row when the user becomes interested in a new opportunity.
- Update the existing row after an application, interview, follow-up, acceptance, rejection, withdrawal, or volunteer start.
- Do not duplicate status details in other Markdown files unless the user specifically requests a temporary handoff memo.

## Source Files

- `PROFILE.md` contains confidential personal information, experience, reusable application answers, and non-family references.
- `volunteer_applications.csv` is the only source of truth for current opportunities, application status, dates, and follow-up actions.
- Do not copy private contact information from `PROFILE.md` into public notes, search results, or messages unless it is required for an authorized application.
- Do not publish or commit confidential profile or reference information to a public repository.

## Information Still to Confirm

Do not guess these details:

- Full legal name
- Emergency contact name, telephone number, and relationship
- General weekly availability, including weekday hours
- Work permit expiry date, when requested
- Reference 2's telephone number, because the current number matches the applicant's number

Ask the user only when one of these details is required for the current application.

## Research Workflow

1. Check that an opportunity is current before recommending it.
2. Prefer official organization or application pages over third-party listings.
3. Record the role, organization, address, duties, schedule, minimum commitment, application link, and posting status.
4. Evaluate how much customer conversation the role is likely to provide.
5. Clearly label unconfirmed information, such as an unknown schedule or an old posting.
6. Do not treat a community program or cafe as a volunteer opening unless a current volunteer position is confirmed.
7. Exclude similarly named places outside British Columbia, such as Edmonds, Washington, or Edmonton, Alberta.

## Application Workflow

1. Read `PROFILE.md` before filling a form.
2. Reuse the prepared answers when they fit, but adapt them honestly to the specific role.
3. Ask for missing required information instead of inventing it.
4. Pause for the user when there is a CAPTCHA, login verification, identity check, legal declaration, policy agreement, background-check authorization, or consent that the user must personally confirm.
5. Do not claim that an application was submitted without a confirmation page or other clear evidence.
6. After an application, interview, rejection, acceptance, or follow-up, update `volunteer_applications.csv` with the date, status, next action, and useful notes.

## Ranking Guidelines

When comparing opportunities, use this order:

1. Recurring customer-facing role near Edmonds, Metrotown, or New Westminster
2. Reception, cafe cashier, visitor service, wayfinding, or technology-help role
3. Convenient transit and a realistic weekly schedule
4. Clear current opening and straightforward application process
5. Opportunity for regular English conversation and community contribution
