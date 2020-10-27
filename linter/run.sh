path=$(dirname "$0")
files_to_check=$(git diff --name-only --diff-filter=AMC master..HEAD | grep _posts | sed "s~^~$path/../~" | sed "s~$~ -c $path/.markdownlint.json~")

if test -z "$files_to_check"
then
    echo 1>&2 "No files to check. Remember to commit changes."
    exit 0
else
    errors=$(echo "$files_to_check" | xargs npx markdownlint-cli 2>&1 | sed "s~^./../~~" | tail -n +2)
fi

if test -z "$errors" 
then
    echo 1>&2 "No issues found."
    exit 0
else
    echo 1>&2 "$errors"
    exit 1
fi
