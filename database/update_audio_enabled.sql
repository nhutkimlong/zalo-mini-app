-- Add audio feature flag for Tourist Places
alter table tourist_places add column if not exists audio_url_en text;
alter table tourist_places add column if not exists audio_enabled boolean not null default false;

update tourist_places
set audio_enabled = true
where audio_url is not null
  and btrim(audio_url) <> ''
  and lower(btrim(audio_url)) <> 'none';

update tourist_places
set audio_enabled = false
where audio_url is null
  or btrim(audio_url) = ''
  or lower(btrim(audio_url)) = 'none';
