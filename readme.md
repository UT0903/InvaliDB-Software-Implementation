#**InvaliDB Implementation**

##### Group7
##### b07902014 蔡承濬 b07902048 李宥霆 b07902124 鄭世朋 b07901043 沈信樺

## 0. **Reproduce**
> // for frontend   
> cd frontend; yarn install; yarn start;
> // for backend
> cd backend; yarn install; node index.js;
## 1.  **INTRODUCTION**

In the generation network has become indispensable. Performing online
shopping or bank operations is fairly normal in our daily life. However,
the rise of these kinds of web services demands nowadays databases or
servers to detect and publish changes with low latency. Given that
traditional databases are mostly pull-based, which would output data
only when receiving queries, and are excelling in dealing with
slowly-changing large amounts of data, not rapidly-changing small
amounts of data. Therefore, real-time databases that can handle high
frequency data change and publish changed data in a short time are more
important today.

We focus on soft real-time databases which accept a deadline violation.
Some real-time databases such as MeteorDB, RethinkDB and Firebase have
recevied used widely today. However, the query mechanisms of these
databases have challenges on scalabilities. There are bottlenecks on
dealing with a large amount of reads and writes.

We implement a real-time database supporting push-based queries based on
a pull-based database, InvaliDB. We claim that it is a solution to
push-based database’s common problem: scalability. Our implementation is
in a software method not in the original hardware method. Also, we
design experiments about performance on scalability of our software
InvaliDB.

1.  **Method comparison**

    1.  **Nowadays’ real-time DB**

There are two main methods of today’s real-time databases, poll-and-diff
and change log tailing. Two methods have different limits on
scalabilities.

In the poll-and-diff method, the server can detect the changes that are
caused by the clients subscribing to the server, but it can’t detect the
changes which occur on different servers. Thus, the server sends the
query to the database periodically (poll), compares the new result of
the query and the old result (diff), and pushes the update back to the
client. However, the period time has a lower bound of about ten seconds,
so the time that the clients get the updates is limited, and if there
are many clients subscribing with many read queries, the server should
re-send a large number of queries to the database, and the time may
increase. This causes congestion on read, and there’s a read scalability
problem.

![](media/image1.png){width="2.7333333333333334in"
height="1.3166666666666667in"}

**Figure 1.** poll-and-diff

In the change-log-tailing method, the database slides to shards, and the
servers subscribe to all the shards and change logs. If there is data
writing to a server, the server distributes the update data to shards of
the database. Then, the database broadcasts the change to all the
servers. The server pushes back the change of data which clients want.
However, if there are many write requests, the server receives a large
broadcast of changes and takes more time to deal with pushing. This
causes congestion on write, and there’s a write scalability problem.

![](media/image2.png){width="2.7031255468066493in" height="1.34375in"}

**Figure 2.** change log tailing

1.  **InvaliDB method**

InvaliDB is based on a pull-based database, e.g. MySQL and MongoDB, but
it deals with updates by an additional cluster, and the cluster uses 2-D
parallel matching to speed up and handle the large number of requests.
The main structure of InvaliDB contains end user, app server, database,
and cluster.

![](media/image5.png){width="2.736111111111111in"
height="1.4319444444444445in"}

**Figure 3.** InvaliDB structure

End server can send two kinds of requests to the app server. One is a
subscription request with a query for reading and another is a write
request to update data. Also, it can receive output results from the app
server.

App server acts as a communication bridge between end server, database
and cluster. It also deals with the data to make communication
reasonable like translating the client request to database query. For
communicating with cluster, app server partitions the subscriptions

and write requests.

![](media/image6.png){width="2.713542213473316in"
height="2.643604549431321in"}

**Figure 4.** Detailed structure of cluster

Cluster has [![](media/image7.png){width="0.5416666666666666in"
height="0.125in"}](https://www.codecogs.com/eqnedit.php?latex=N%5Ctimes%20N#0)
nodes as matching units. Each node stores part of data by partition.
Nodes in the same row group the complete result data of some subscribed
queries. Every node in the same columns stores data with the same
vertical partition. With these properties of cluster, we know the
detailed paths and partition ways of requests and data.

About the path of read (blue arrows in Figure 3), a client in the end
user sends subscription requests with some read queries to the app
server first, and next, the app server sends translated database queries
to the database and gets the result data. Then, the app server
partitions horizontally every subscribed read queries and its result
data to a row of cluster, and the result data are partitioned vertically
to n nodes in the row.

About the path of write (red arrows in Figure 3), a client in the end
user sends write requests for the data changes to the app server. Then,
the app server sends translated database queries to the database to
update the data in the database. Simultaneously, the write requests are
partitioned vertically to the column of cluster.

About the matching mechanism and the path of output (green arrows in
Figure 3), when a subscribed read query and its result data arrives at a
row of the cluster, the result data is sent from the cluster through the
app server to the subscribing client in the end user. When a write
request is sent to a column of cluster, the node in the column and in
the subscribed row matches the result data and the data change. Next, an
update is sent from the cluster through the app server to the
subscribing client in the end user. This 2-D parallel matching method.

1.  **METHODOLOGY**

We choose MongoDB as our pull-based database since MongoDB is more
common in web applications. Therefore, we use JavaScript to implement
our program for convenience to access MongoDB.

Now, we see the end-user as the front end. There is a constraint on
writing. We ask to provide the index of data so that we can do the
hashing correctly.

App server is the back end. We hash the requests and the data received
from MongoDB by their index modulo n. The data and the write requests
with the same remainder will be allocated to the same column of the
cluster, and the subscriptions with the same remainder will be allocated
to the same row of the cluster.

The nodes of the cluster are originally different computers to the
storage data and match the update. Since we don’t have enough hardware
resources, we create the virtual cluster on software, and we use the
resource of workstation. For each node, we name it child and allocate
some CPU resource and storage space to it.

1.  **EXPERIMENT**

The target of implementing IvaliDB is to have good scalability. We
design two experiments to test. One is for read scalability, and another
is for write scalability. Also, we have tested for the relationship
between the scalabilities and the cluster size. As for the implementing
environment, the original paper implemented it on multiple hardware
cloud computers, and each of the cluster nodes was installed on a
computer; therefore, each of the nodes will not affect the others.
However, since we don’t have such a large number of computers, we then
simplify the architecture of the cluster part. We combine the app server
part and the cluster nodes part. Each of the cluster nodes is a child
process of the app server. They communicate with each other by
inter-process communication (IPC). This architecture was deployed on NTU
CSIE workstation linux5, whose specification is x86\_64 linux, with 24
Intel Xeon E5-2620 @ 2.00GHz cpus and 126G memory. As for the database
part, we use the mongoDB cloud service.

For the two experiments, each of a write request contains a modification
of one piece of data, and each of a read request contains a query of ten
pieces of data.

In the experiment of read scalability, Client 1 fixes the frequency of
write requests at 3 times per second, and Client 2 increases the
frequency of read requests from 0 to 450 times per second, Client 3
pre-queries and pre-subscribes to 10000 pieces of data before the
experiment starts, and we measure the latency of the read requests.
Here, the latency of the read requests means the time interval between
the app server receiving a request and the app server returning the
result of the query. Also, we do the same test in different sizes of
cluster.

The result is in Figure 5. Since the path of read needs to go through
the database , awaiting for the results , and put results into the
corresponding cluster nodes and subscribe them, and then return the data
to client side. So the scalability is limited by the database, because
each query has to wait in the queue of accessing the database.
Therefore, the latency grows when the frequency of read requests exceeds
a threshold. However, we can observe that with the increasing size of
the cluster, the threshold will also increase. This is because the
latency of the path between the app server updates data to the cluster
and the cluster returns the subscription of the data decreases as the
cluster’s size grows. More data can be parallely handled and returned.
As you can see, the InvaliDB can improve the read scalability with more
cluster nodes.

In Figure 5, the threshold gap between 4×4 nodes and 5×5 nodes is much
smaller than the gap between 3×3 nodes and 4×4 nodes, and it is because
of the limited CPU resource allocation, the benefit of parallel
computing decreases as more threads are created. Another reason for the
deviation result is the speed of network transmission. Since we measure
the latency between the app server receiving requests and the app server
returning data, the network access delay to the cloud mongoDB can vary.
We’ve tried to solve this problem by using the local mongoDB database;
however, the workstation doesn’t have mongoDB and we don’t have sudo
privileges on installing it on the workstation.

![](media/image3.png){width="2.736111111111111in"
height="2.0520833333333335in"}

<span id="_gjdgxs" class="anchor"></span>**Figure 5.** read scalability
test

In the experiment of write scalability, we fix the frequency of read
requests at 2 times per second, and increase the frequency of write
requests from 0 to 450 times per second, and measure the latency of
increasing write requests. Also, we do the same test in different sizes
of cluster.

The result is in Figure 6. We can observe that the latency is always at
some constant. It is because the app server asynchronously writes data
to the database and the cluster, so it won’t take time to wait for the
write return. It represents that the method using clusters without
accessing pull-based databases can provide data updates immediately.
Thus, the InvaliDB can improve the write scalability.

In Figure 6, there are some high latencies occuring. We speculate that
it is because there is network latency when connecting the workstation.

![](media/image4.png){width="2.736111111111111in"
height="2.0520833333333335in"}

**Figure 6.** write scalability test

1.  **CONCLUSION**

2.  **REFERENCES**

> Wolfram Wingerath, Felix Gessert, and Norbert Ritter*.* InvaliDB:
> Scalable Push-Based Real-Time Querieson Top of Pull-Based Databases
> (Extended). *PVLDB*, vol. 13, no. 12, pp. 3032-3045, Aug, 2020
>
> [*http://www.vldb.org/pvldb/vol13/p3032-wingerath.pdf*](http://www.vldb.org/pvldb/vol13/p3032-wingerath.pdf)
>
> InvaliDB: Scalable Push-Based Real-Time Queries on Top of Pull-Based
> Databases – ICDE 2020, Dallas
>
> [*https://www.youtube.com/watch?v=5N6zAa7zyfQ*](https://www.youtube.com/watch?v=5N6zAa7zyfQ)
