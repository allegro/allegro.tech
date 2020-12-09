path=$(dirname "$0")
files_to_check=$(git diff --name-only --diff-filter=AMC master..HEAD | grep _posts | sed "s~^~$path/../~")

if test -z "$files_to_check"
then
    echo 1>&2 "No files to check. Remember to commit changes."
    exit 0
else
    files_to_check_by_linter=$(echo "$files_to_check" | sed "s~$~ -c $path/.markdownlint.json~")
    errors=$(echo "$files_to_check_by_linter" | xargs npx markdownlint-cli 2>&1 | sed "s~^./../~~" | tail -n +2)

    authors=$(echo "$files_to_check" | xargs cat | grep "author:" | grep "[[:alpha:]]*\.[[:alpha:]]*" -o)
    authors_imgs=$(echo "$authors" | sed "s~^~$path/../img/authors/~" | sed "s/$/.jpg/")
    authors_pages=$(echo "$authors" | sed "s~^~$path/../authors/~" | sed "s~$~/index.md~")

    no_authors_imgs=""
    for img in $authors_imgs; do
        if test ! -f "$img"
        then
            no_authors_imgs+="$img No authors image\n"
        fi
    done

    no_authors_pages=""
    wrong_authors_pages_layout=""
    wrong_authors_pages_author=""
    for author in $authors; do
        author_page=$(echo "$author" | sed "s~^~$path/../authors/~" | sed "s~$~/index.md~")
        if test ! -f "$author_page"
        then
            no_authors_pages+="$author_page No author page\n"
        else
            author_page_content=$(cat $author_page)
            author_page_layout=$(echo "$author_page_content" | grep -w "layout: author")
            if test -z "$author_page_layout"; then
                wrong_authors_pages_layout+="$author_page Wrong author page layout\n"
            fi

            author_page_author=$(echo "$author_page_content" | grep -w "author: $author")
            if test -z "$author_page_author"; then
                wrong_authors_pages_author+="$author_page Wrong page author\n"
            fi
        fi
    done

    all_errors=()

    if test ! -z "$errors"
    then
        all_errors+=( "$errors" )
    fi

    if test ! -z "$no_authors_imgs"
    then
        all_errors+=( "$(echo "$no_authors_imgs" | sed \$d)" )
    fi

    if test ! -z "$no_authors_pages"
    then
        all_errors+=( "$(echo "$no_authors_pages" | sed \$d)" )
    fi

    if test ! -z "$wrong_authors_pages_layout"
    then
        all_errors+=( "$(echo "$wrong_authors_pages_layout" | sed \$d)" )
    fi

    if test ! -z "$wrong_authors_pages_author"
    then
        all_errors+=( "$(echo "$wrong_authors_pages_author" | sed \$d)" )
    fi

    errors_content="$( printf "\n%s" "${all_errors[@]}" | tail -n +2) "
fi

if test -z "$errors_content" 
then
    echo 1>&2 "No issues found."
    exit 0
else
    echo 1>&2 "$errors_content"
    exit 1
fi
