path=$(dirname "$0")
errors=$(git diff --name-only --diff-filter=AMC master..HEAD | grep _posts | sed "s~^~$path/../~" | sed "s~$~ -c $path/.markdownlint.json~" | xargs npx markdownlint-cli 2>&1 | sed "s~^./../~~")

if test -z "$errors" 
then
    exit 0
else
    echo 1>&2 "$errors"
    exit 1
fi