grant usage on schema private to anon, authenticated;
revoke all on function private.create_public_establishment_appointment(text,text,text,text,text,numeric,integer,date,time,text) from public;
grant execute on function private.create_public_establishment_appointment(text,text,text,text,text,numeric,integer,date,time,text) to anon, authenticated;