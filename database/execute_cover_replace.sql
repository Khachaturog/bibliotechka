USE bibliotechka;

-- Замена /images/covers на https://35401aca832c.hosting.myjino.ru в поле cover
UPDATE `data` 
SET `cover` = REPLACE(`cover`, '/images/covers', 'https://35401aca832c.hosting.myjino.ru')
WHERE `cover` LIKE '%/images/covers%';

