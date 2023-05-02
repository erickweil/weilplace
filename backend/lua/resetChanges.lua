-- O que este comando faz é então de forma atômica:
-- 1. pega as mudanças desde o trimindex
-- 2. seta as mudanças com o intervalo obtido
-- 3. registra o novo identificador
-- 4. registra o novo índice do último save

local key_changes = KEYS[1];
local key_identifier = KEYS[2];
local key_savedindex = KEYS[3];

local trimindex = ARGV[1];
local newidentifier = ARGV[2];
local newsavedindex = ARGV[3];

local changes = redis.call('GETRANGE',key_changes,trimindex,-1);
redis.call('SET',key_changes,changes);
redis.call('SET',key_identifier,newidentifier);
redis.call('SET',key_savedindex,newsavedindex);

return 'OK';