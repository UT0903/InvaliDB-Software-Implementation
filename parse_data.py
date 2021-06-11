query = []
modify = []
import sys

def generate_nums(start, step, type):
    max_len = len(query) if type == 'query' else len(modify)
    res = []
    for i in range(start, max_len, step):
       res.append(i) 
    return res

with open(sys.argv[1], "r") as f:
    lines = f.readlines()
    i = 0
    for line in lines:
        op = line.split('-')[0]
        if op == 'query' or op == 'modify':
            remaining = line.split('-')[1]
            content = remaining.split(' ')
            id, type, time = int(content[0]), content[1], int(content[5]) if op == 'query' else int(content[4])
            if op == 'query':
                if type == 'starts':
                    query.append(-time)
                else:
                    query[id] += time
            else:
                if type == 'starts':
                    modify.append(-time)
                else:
                    modify[id] += time
        else:
            pass

# generate_nums(start, step, type)
wanted_query = generate_nums(100, 100, 'query') # [100, 200, 300, 400...]
print('Query:')
for i in wanted_query:
    print('query-' + str(i) + ': ' + str(query[i]))

wanted_modify = generate_nums(100, 100, 'modify') # [100, 200, 300, 400...]
print('\nModify:')
for i in wanted_modify:
    print('modify-' + str(i) + ': ' + str(modify[i]))

