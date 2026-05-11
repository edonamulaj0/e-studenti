INSERT OR IGNORE INTO users (name, surname, email, email_verified)
VALUES
  ('Jeta', 'Mulaj', 'jeta.mulaj@e-studenti.local', 1),
  ('Florian', 'Hajredini', 'florian.hajredini@e-studenti.local', 1),
  ('Edona', 'Mulaj', 'edona.mulaj@e-studenti.local', 1),
  ('Leart', 'Lama', 'leart.lama@e-studenti.local', 1);

UPDATE users SET name = 'Jeta', surname = 'Mulaj', email_verified = 1
WHERE email = 'jeta.mulaj@e-studenti.local';

UPDATE users SET name = 'Florian', surname = 'Hajredini', email_verified = 1
WHERE email = 'florian.hajredini@e-studenti.local';

UPDATE users SET name = 'Edona', surname = 'Mulaj', email_verified = 1
WHERE email = 'edona.mulaj@e-studenti.local';

UPDATE users SET name = 'Leart', surname = 'Lama', email_verified = 1
WHERE email = 'leart.lama@e-studenti.local';

UPDATE materials
SET user_id = (SELECT id FROM users WHERE email = 'jeta.mulaj@e-studenti.local')
WHERE user_id = (SELECT id FROM users WHERE email = 'system@srh.local')
  AND faculty = 'MED';

UPDATE materials
SET user_id = (SELECT id FROM users WHERE email = 'florian.hajredini@e-studenti.local')
WHERE user_id = (SELECT id FROM users WHERE email = 'system@srh.local')
  AND faculty = 'FIN'
  AND department = 'Gjeodezi';

UPDATE materials
SET user_id = (SELECT id FROM users WHERE email = 'edona.mulaj@e-studenti.local')
WHERE user_id = (SELECT id FROM users WHERE email = 'system@srh.local')
  AND faculty = 'FIEK'
  AND department = 'TIK';

UPDATE materials
SET user_id = (SELECT id FROM users WHERE email = 'leart.lama@e-studenti.local')
WHERE user_id = (SELECT id FROM users WHERE email = 'system@srh.local')
  AND faculty = 'FIEK'
  AND department = '//';
