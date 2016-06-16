# OpenSource Site

## Refreshing OS resources

OSS site refresh script is located in `scripts/open-source/` directory. Since it is written in python and has few dependencies, it is advisable to run it in VirtualEnv:

```
cd scripts/open-source
virtualenv .
. bin/activate
pip install -r requirements.txt
python refresh-opensource.py ../../_data/opensource-repos.json
```
