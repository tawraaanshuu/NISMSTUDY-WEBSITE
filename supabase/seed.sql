-- ===========================================================================
-- NISMSTUDY — seed data
-- Run after schema.sql. Safe to re-run: fixed UUIDs + ON CONFLICT DO NOTHING.
--
-- The questions below are genuine, timeless concept checks intended to prove
-- the mock-test flow works end to end. They are NOT a substitute for the real
-- 400-500 question bank — replace/extend them from the admin portal.
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- Courses
-- ---------------------------------------------------------------------------
insert into public.courses
  (id, title, exam_name, description, price, mock_duration_days, display_order, is_published)
values
  ('11111111-1111-4111-8111-111111111111',
   'NISM Series VIII: Equity Derivatives',
   'NISM Series VIII: Equity Derivatives',
   'Full question bank for the equity derivatives certification, covering futures, options, trading mechanics, clearing and settlement.',
   '329', 15, 1, true),

  ('22222222-2222-4222-8222-222222222222',
   'NISM Series V-A: Mutual Fund Distributors',
   'NISM Series V-A: Mutual Fund Distributors',
   'Practice questions on mutual fund structures, NAV, scheme types, distribution regulations and investor services.',
   '329', 15, 2, true),

  ('33333333-3333-4333-8333-333333333333',
   'NISM Series I: Currency Derivatives',
   'NISM Series I: Currency Derivatives',
   'Question bank covering currency markets, exchange-traded currency futures and options, and settlement mechanics.',
   '329', 15, 3, true)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Equity Derivatives (Series VIII)
-- ---------------------------------------------------------------------------
insert into public.quizzes
  (course_id, question_text, option_a, option_b, option_c, option_d, correct_option, explanation, display_order)
values
  ('11111111-1111-4111-8111-111111111111',
   'Which body regulates the securities market in India?',
   'RBI', 'SEBI', 'IRDAI', 'PFRDA', 'B',
   'The Securities and Exchange Board of India (SEBI) is the regulator for the Indian securities market.', 1),

  ('11111111-1111-4111-8111-111111111111',
   'A call option gives the buyer the right, but not the obligation, to:',
   'Sell the underlying at the strike price', 'Buy the underlying at the strike price',
   'Buy the underlying at the market price', 'Sell the underlying at the market price', 'B',
   'A call option confers the right to BUY the underlying asset at the pre-agreed strike price.', 2),

  ('11111111-1111-4111-8111-111111111111',
   'A put option gives the buyer the right to:',
   'Buy the underlying at the strike price', 'Sell the underlying at the strike price',
   'Receive a dividend', 'Convert the option into a future', 'B',
   'A put option confers the right to SELL the underlying at the strike price.', 3),

  ('11111111-1111-4111-8111-111111111111',
   'What is the maximum loss for the buyer of an option?',
   'Unlimited', 'The strike price', 'The premium paid', 'The margin deposited', 'C',
   'An option buyer can lose at most the premium paid, since exercising is optional.', 4),

  ('11111111-1111-4111-8111-111111111111',
   'In a futures contract, the obligation to perform rests with:',
   'Only the buyer', 'Only the seller', 'Both buyer and seller', 'Neither party', 'C',
   'Unlike options, a futures contract obliges BOTH parties to settle the contract.', 5),

  ('11111111-1111-4111-8111-111111111111',
   'The intrinsic value of a call option is:',
   'Strike price minus spot price, floored at zero', 'Spot price minus strike price, floored at zero',
   'Always equal to the premium', 'Always zero before expiry', 'B',
   'Call intrinsic value = max(Spot - Strike, 0); it can never be negative.', 6),

  ('11111111-1111-4111-8111-111111111111',
   'Mark-to-market (MTM) settlement in futures is carried out:',
   'Only at expiry', 'Daily', 'Weekly', 'Only when the position is closed', 'B',
   'Futures positions are marked to market and settled daily against the closing price.', 7),

  ('11111111-1111-4111-8111-111111111111',
   'Who guarantees settlement of trades executed on a recognised stock exchange?',
   'The broker', 'The clearing corporation', 'The depository', 'The individual counterparty', 'B',
   'The clearing corporation acts as the central counterparty and guarantees settlement.', 8)
on conflict do nothing;

-- ---------------------------------------------------------------------------
-- Mutual Fund Distributors (Series V-A)
-- ---------------------------------------------------------------------------
insert into public.quizzes
  (course_id, question_text, option_a, option_b, option_c, option_d, correct_option, explanation, display_order)
values
  ('22222222-2222-4222-8222-222222222222',
   'Net Asset Value (NAV) of a mutual fund scheme is calculated as:',
   'Total assets divided by total investors', 'Net assets divided by number of units outstanding',
   'Total income divided by expenses', 'Market price divided by face value', 'B',
   'NAV = (Assets - Liabilities) / number of outstanding units.', 1),

  ('22222222-2222-4222-8222-222222222222',
   'Which registration is mandatory to distribute mutual funds in India?',
   'ARN from AMFI', 'PAN from Income Tax Department', 'DIN from MCA', 'CIN from ROC', 'A',
   'Distributors must obtain an AMFI Registration Number (ARN) to sell mutual funds.', 2),

  ('22222222-2222-4222-8222-222222222222',
   'An open-ended mutual fund scheme allows investors to:',
   'Buy and redeem units on an ongoing basis', 'Buy units only during the NFO',
   'Redeem units only at maturity', 'Trade units only on an exchange', 'A',
   'Open-ended schemes offer continuous purchase and redemption at NAV-based prices.', 3),

  ('22222222-2222-4222-8222-222222222222',
   'A Systematic Investment Plan (SIP) allows an investor to:',
   'Invest a lump sum once', 'Invest a fixed amount at regular intervals',
   'Withdraw a fixed amount regularly', 'Switch between schemes automatically', 'B',
   'An SIP invests a fixed sum at regular intervals, averaging the purchase cost over time.', 4),

  ('22222222-2222-4222-8222-222222222222',
   'Exit load in a mutual fund scheme is charged:',
   'At the time of purchase', 'At the time of redemption', 'Annually', 'Only on dividend payout', 'B',
   'Exit load is deducted from redemption proceeds when units are sold within the specified period.', 5),

  ('22222222-2222-4222-8222-222222222222',
   'The trustees of a mutual fund primarily act in the interest of:',
   'The AMC', 'The sponsor', 'The unit holders', 'The distributors', 'C',
   'Trustees hold the fund property in trust and are accountable to the unit holders.', 6)
on conflict do nothing;

-- ---------------------------------------------------------------------------
-- Currency Derivatives (Series I)
-- ---------------------------------------------------------------------------
insert into public.quizzes
  (course_id, question_text, option_a, option_b, option_c, option_d, correct_option, explanation, display_order)
values
  ('33333333-3333-4333-8333-333333333333',
   'In the currency pair USD/INR, the base currency is:',
   'INR', 'USD', 'Both', 'Neither', 'B',
   'In a quotation, the FIRST currency is the base currency — here, USD.', 1),

  ('33333333-3333-4333-8333-333333333333',
   'Exchange-traded currency futures in India are settled in:',
   'US Dollars', 'Indian Rupees', 'The currency of the buyer''s choice', 'Gold', 'B',
   'Exchange-traded currency derivatives in India are cash settled in Indian Rupees.', 2),

  ('33333333-3333-4333-8333-333333333333',
   'If the INR depreciates against the USD, then:',
   'More rupees are needed to buy one dollar', 'Fewer rupees are needed to buy one dollar',
   'The exchange rate is unchanged', 'The dollar has weakened', 'A',
   'Depreciation of the rupee means each dollar costs more rupees.', 3),

  ('33333333-3333-4333-8333-333333333333',
   'Hedging with currency futures is primarily done to:',
   'Maximise speculative profit', 'Reduce the risk of adverse exchange rate movement',
   'Avoid paying margins', 'Guarantee a profit', 'B',
   'Hedging aims to reduce exposure to unfavourable currency movements, not to maximise profit.', 4),

  ('33333333-3333-4333-8333-333333333333',
   'Initial margin in currency futures is collected to:',
   'Pay brokerage', 'Cover potential losses from price movement',
   'Pay exchange listing fees', 'Fund the settlement guarantee dividend', 'B',
   'Initial margin covers the potential one-day loss on the position and secures performance.', 5),

  ('33333333-3333-4333-8333-333333333333',
   'Which institution manages India''s foreign exchange reserves?',
   'SEBI', 'RBI', 'Ministry of Corporate Affairs', 'NSE', 'B',
   'The Reserve Bank of India manages the country''s foreign exchange reserves and FEMA regulations.', 6)
on conflict do nothing;

-- ---------------------------------------------------------------------------
-- Home page support teaser (optional; the section hides itself if absent)
-- ---------------------------------------------------------------------------
insert into public.home_support_content (id, title, body, is_active)
values
  ('44444444-4444-4444-8444-444444444444',
   'Need help choosing an exam?',
   'Email info@nismstudy.in and we will help you pick the right NISM module and get started.',
   true)
on conflict (id) do nothing;
