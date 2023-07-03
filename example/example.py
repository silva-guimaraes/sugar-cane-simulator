import requests
import pandas as pd


def cost_progression(building):
    current_cost = building['currentprice']
    cost_list = []
    range_start = building['quantity']
    for i in range(range_start, 100):
        cost_list.append(current_cost)
        current_cost = round(current_cost * 1.2, 2)

    return pd.DataFrame({
        'name': [building['name'] for i in range(range_start, 100)],
        'cost': cost_list,
        })


site = 'http://127.0.0.1:3000'
buildings = requests.get(site + '/buildings').json()
status = requests.get(site + '/status').json()
url = site + f'/sell?qnt={status["sugarcane"]}'
ret = requests.get(url).json()
print(ret)

money = status['sugarcane'] + status['money']

collector = cost_progression(buildings['collector'])
farmer = cost_progression(buildings['farmer'])
merchant = cost_progression(buildings['merchant'])

buy_order = pd.concat([collector, farmer, merchant]).sort_values(
        by=['cost'], ascending=True)

buy_order['cumsum'] = buy_order['cost'].cumsum()
can_buy = buy_order['cumsum'] <= money

countedBuildings = {}
for building in buy_order[can_buy]['name']:
    if building not in countedBuildings:
        countedBuildings[building] = 1
    else:
        countedBuildings[building] += 1

query = []
for k, v in countedBuildings.items():
    query += f'&buy={k}&qnt={v}'
query[0] = '?'
url = site + '/buildings/' + ''.join(query)
ret = requests.get(url).json()
print(url)
print(ret)
