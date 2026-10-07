"""Apply only the two ENARM service settings; never touch Vanta production.
Requires a logged-in Railway CLI. Does not create resources or manage secrets.
"""
import json
import subprocess
from pathlib import Path
config = json.loads((Path(__file__).resolve().parent.parent / 'infra/services.json').read_text())
query = 'mutation($serviceId:String!,$environmentId:String!,$input:ServiceInstanceUpdateInput!){serviceInstanceUpdate(serviceId:$serviceId,environmentId:$environmentId,input:$input)}'
for name, service in config['services'].items():
    variables = {'serviceId': service['id'], 'environmentId': config['environmentId'], 'input': {**config['settings'], 'preDeployCommand': service['preDeployCommand']}}
    subprocess.run(['railway','api',query,'--variables',json.dumps(variables)],check=True)
    print('Configured', name)
