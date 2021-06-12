search_type = 'modify' # 'query' or 'modify'
idxs = range(2, 458, 1) # (start, end, step)
file_paths = ['backend/write_3wps_4node.txt', 'backend/query_3wps_9node.txt', 'backend/write_3wps_16node.txt', 'backend/write_3wps_25node.txt']
out_file_name = 'out.png'
import sys
import matplotlib.pyplot as plt
def read_txt(file_path):
    with open(file_path, "r") as f:
        lines = f.readlines()
        lines = list(map(lambda x: x.strip(), lines))
        lines = list(filter(lambda x: "{}-".format(search_type) in x, lines))
    return lines
def cal_time(lines):
    def get_timestamp(idx):
        timestamps = [-1, -1] # [start_time, end_time]
        for line in lines:
            if "{}-{} ".format(search_type, idx) in line:
                line = line.split()
                if line[1] == 'starts':
                    timestamps[0] = int(line[-1])
                elif line[1] == 'ends':
                    timestamps[1] = int(line[-1])
        return timestamps[1] - timestamps[0] if -1 not in timestamps else -1
    time_intervals = []
    for idx in idxs:
        time_intervals.append([idx, get_timestamp(idx)])
        time_intervals = list(filter(lambda x: x[1] != -1, time_intervals))
    return time_intervals
        
def draw_plt(datas):
    #list(map(, x_axis))
    colors = [(255/255,100/255,100/255), (100/255,100/255,255/255), (100/255,255/255,100/255), (100/255,255/255,255/255), (255/255,100/255,255/255)]
    plt.xlabel("queries ")
    plt.ylabel("latency (ms)")
    plt.grid(True)
    node_num = [4, 9, 16, 25]
    for i, data in enumerate(datas):
        x_axis, y_axis = zip(*data)
        plt.plot(x_axis, y_axis, color=colors[i % len(colors)], label=str(node_num[i]) + " nodes")
    plt.legend()
    #plt.show()
    plt.savefig(out_file_name)

def main():
    datas = []
    for file_path in file_paths:
        lines = read_txt(file_path)
        datas.append(cal_time(lines))
    draw_plt(datas)
main()

