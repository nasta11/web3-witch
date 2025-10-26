#!/bin/bash
echo "Очистка cookies и кэша для apr.gov.rs и eid.gov.rs ..."

## --- Safari ---
echo "Safari:"
rm -rf ~/Library/Caches/com.apple.Safari
sqlite3 ~/Library/Safari/Databases/Databases.db "DELETE FROM Origins WHERE origin LIKE '%apr.gov.rs%' OR origin LIKE '%eid.gov.rs%';" 2>/dev/null
sqlite3 ~/Library/Safari/LocalStorage/LocalStorage.db "DELETE FROM LocalStorage WHERE origin LIKE '%apr.gov.rs%' OR origin LIKE '%eid.gov.rs%';" 2>/dev/null

killall Safari 2>/dev/null

## --- Chrome ---
echo "Chrome:"
sqlite3 ~/Library/Application\ Support/Google/Chrome/Default/Cookies "DELETE FROM cookies WHERE host_key LIKE '%apr.gov.rs%' OR host_key LIKE '%eid.gov.rs%';" 2>/dev/null
rm -rf ~/Library/Caches/Google/Chrome/Default/*

killall "Google Chrome" 2>/dev/null

echo "✅ Готово. Перезапусти браузеры и пробуй снова зайти."

