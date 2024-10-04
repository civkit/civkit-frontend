                                                   Table "public._prisma_migrations"
       Column        |           Type           | Collation | Nullable | Default | Storage  | Compression | Stats target | Description 
---------------------+--------------------------+-----------+----------+---------+----------+-------------+--------------+-------------
 id                  | character varying(36)    |           | not null |         | extended |             |              | 
 checksum            | character varying(64)    |           | not null |         | extended |             |              | 
 finished_at         | timestamp with time zone |           |          |         | plain    |             |              | 
 migration_name      | character varying(255)   |           | not null |         | extended |             |              | 
 logs                | text                     |           |          |         | extended |             |              | 
 rolled_back_at      | timestamp with time zone |           |          |         | plain    |             |              | 
 started_at          | timestamp with time zone |           | not null | now()   | plain    |             |              | 
 applied_steps_count | integer                  |           | not null | 0       | plain    |             |              | 
Indexes:
    "_prisma_migrations_pkey" PRIMARY KEY, btree (id)
Access method: heap

                    Index "public._prisma_migrations_pkey"
 Column |         Type          | Key? | Definition | Storage  | Stats target 
--------+-----------------------+------+------------+----------+--------------
 id     | character varying(36) | yes  | id         | extended | 
primary key, btree, for table "public._prisma_migrations"

                                                                          Table "public.chats"
      Column      |              Type              | Collation | Nullable |                Default                 | Storage  | Compression | Stats target | Description 
------------------+--------------------------------+-----------+----------+----------------------------------------+----------+-------------+--------------+-------------
 chat_id          | integer                        |           | not null | nextval('chats_chat_id_seq'::regclass) | plain    |             |              | 
 order_id         | integer                        |           | not null |                                        | plain    |             |              | 
 chatroom_url     | text                           |           | not null |                                        | extended |             |              | 
 status           | text                           |           |          | 'pending'::character varying           | extended |             |              | 
 created_at       | timestamp(3) without time zone |           |          | CURRENT_TIMESTAMP                      | plain    |             |              | 
 accept_offer_url | text                           |           |          |                                        | extended |             |              | 
 token            | text                           |           |          |                                        | extended |             |              | 
Indexes:
    "chats_pkey" PRIMARY KEY, btree (chat_id)
Foreign-key constraints:
    "chats_order_id_fkey" FOREIGN KEY (order_id) REFERENCES orders(order_id) ON UPDATE CASCADE ON DELETE RESTRICT
Access method: heap

                 Sequence "public.chats_chat_id_seq"
  Type   | Start | Minimum |  Maximum   | Increment | Cycles? | Cache 
---------+-------+---------+------------+-----------+---------+-------
 integer |     1 |       1 | 2147483647 |         1 | no      |     1
Owned by: public.chats.chat_id

                   Index "public.chats_pkey"
 Column  |  Type   | Key? | Definition | Storage | Stats target 
---------+---------+------+------------+---------+--------------
 chat_id | integer | yes  | chat_id    | plain   | 
primary key, btree, for table "public.chats"

                                                                          Table "public.invoices"
    Column    |              Type              | Collation | Nullable |                   Default                    | Storage  | Compression | Stats target | Description 
--------------+--------------------------------+-----------+----------+----------------------------------------------+----------+-------------+--------------+-------------
 invoice_id   | integer                        |           | not null | nextval('invoices_invoice_id_seq'::regclass) | plain    |             |              | 
 order_id     | integer                        |           |          |                                              | plain    |             |              | 
 bolt11       | text                           |           | not null |                                              | extended |             |              | 
 amount_msat  | bigint                         |           | not null |                                              | plain    |             |              | 
 description  | text                           |           |          |                                              | extended |             |              | 
 status       | text                           |           |          | 'pending'::character varying                 | extended |             |              | 
 created_at   | timestamp(3) without time zone |           |          | CURRENT_TIMESTAMP                            | plain    |             |              | 
 expires_at   | timestamp(3) without time zone |           |          |                                              | plain    |             |              | 
 payment_hash | text                           |           |          |                                              | extended |             |              | 
 invoice_type | text                           |           |          |                                              | extended |             |              | 
 user_type    | text                           |           |          |                                              | extended |             |              | 
Indexes:
    "invoices_pkey" PRIMARY KEY, btree (invoice_id)
    "invoices_order_id_user_type_invoice_type_status_key" UNIQUE, btree (order_id, user_type, invoice_type, status)
Access method: heap

              Sequence "public.invoices_invoice_id_seq"
  Type   | Start | Minimum |  Maximum   | Increment | Cycles? | Cache 
---------+-------+---------+------------+-----------+---------+-------
 integer |     1 |       1 | 2147483647 |         1 | no      |     1
Owned by: public.invoices.invoice_id

   Index "public.invoices_order_id_user_type_invoice_type_status_key"
    Column    |  Type   | Key? |  Definition  | Storage  | Stats target 
--------------+---------+------+--------------+----------+--------------
 order_id     | integer | yes  | order_id     | plain    | 
 user_type    | text    | yes  | user_type    | extended | 
 invoice_type | text    | yes  | invoice_type | extended | 
 status       | text    | yes  | status       | extended | 
unique, btree, for table "public.invoices"

                   Index "public.invoices_pkey"
   Column   |  Type   | Key? | Definition | Storage | Stats target 
------------+---------+------+------------+---------+--------------
 invoice_id | integer | yes  | invoice_id | plain   | 
primary key, btree, for table "public.invoices"

                                                                           Table "public.orders"
      Column       |              Type              | Collation | Nullable |                 Default                  | Storage  | Compression | Stats target | Description 
-------------------+--------------------------------+-----------+----------+------------------------------------------+----------+-------------+--------------+-------------
 order_id          | integer                        |           | not null | nextval('orders_order_id_seq'::regclass) | plain    |             |              | 
 customer_id       | integer                        |           |          |                                          | plain    |             |              | 
 order_details     | text                           |           |          |                                          | extended |             |              | 
 amount_msat       | integer                        |           |          |                                          | plain    |             |              | 
 currency          | text                           |           | not null |                                          | extended |             |              | 
 payment_method    | text                           |           |          |                                          | extended |             |              | 
 status            | text                           |           |          | 'pending'::character varying             | extended |             |              | 
 created_at        | timestamp(3) without time zone |           |          | CURRENT_TIMESTAMP                        | plain    |             |              | 
 escrow_status     | text                           |           |          | 'pending'::character varying             | extended |             |              | 
 type              | smallint                       |           |          |                                          | plain    |             |              | 
 premium           | numeric(65,30)                 |           |          | 0.00                                     | main     |             |              | 
 taker_customer_id | integer                        |           |          |                                          | plain    |             |              | 
Indexes:
    "orders_pkey" PRIMARY KEY, btree (order_id)
Referenced by:
    TABLE "chats" CONSTRAINT "chats_order_id_fkey" FOREIGN KEY (order_id) REFERENCES orders(order_id) ON UPDATE CASCADE ON DELETE RESTRICT
    TABLE "payouts" CONSTRAINT "payouts_order_id_fkey" FOREIGN KEY (order_id) REFERENCES orders(order_id) ON UPDATE CASCADE ON DELETE RESTRICT
Access method: heap

                Sequence "public.orders_order_id_seq"
  Type   | Start | Minimum |  Maximum   | Increment | Cycles? | Cache 
---------+-------+---------+------------+-----------+---------+-------
 integer |     1 |       1 | 2147483647 |         1 | no      |     1
Owned by: public.orders.order_id

                   Index "public.orders_pkey"
  Column  |  Type   | Key? | Definition | Storage | Stats target 
----------+---------+------+------------+---------+--------------
 order_id | integer | yes  | order_id   | plain   | 
primary key, btree, for table "public.orders"

                                                                       Table "public.payment_hashes"
     Column     |              Type              | Collation | Nullable |                  Default                   | Storage  | Compression | Stats target | Description 
----------------+--------------------------------+-----------+----------+--------------------------------------------+----------+-------------+--------------+-------------
 id             | integer                        |           | not null | nextval('payment_hashes_id_seq'::regclass) | plain    |             |              | 
 order_id       | integer                        |           |          |                                            | plain    |             |              | 
 payment_hash   | text                           |           | not null |                                            | extended |             |              | 
 payment_secret | text                           |           |          |                                            | extended |             |              | 
 amount_sat     | bigint                         |           | not null |                                            | plain    |             |              | 
 status         | text                           |           |          | 'pending'::character varying               | extended |             |              | 
 created_at     | timestamp(3) without time zone |           |          | CURRENT_TIMESTAMP                          | plain    |             |              | 
 expires_at     | timestamp(3) without time zone |           |          |                                            | plain    |             |              | 
Indexes:
    "payment_hashes_pkey" PRIMARY KEY, btree (id)
Access method: heap

               Sequence "public.payment_hashes_id_seq"
  Type   | Start | Minimum |  Maximum   | Increment | Cycles? | Cache 
---------+-------+---------+------------+-----------+---------+-------
 integer |     1 |       1 | 2147483647 |         1 | no      |     1
Owned by: public.payment_hashes.id

              Index "public.payment_hashes_pkey"
 Column |  Type   | Key? | Definition | Storage | Stats target 
--------+---------+------+------------+---------+--------------
 id     | integer | yes  | id         | plain   | 
primary key, btree, for table "public.payment_hashes"

                                                                        Table "public.payouts"
   Column   |              Type              | Collation | Nullable |                  Default                   | Storage  | Compression | Stats target | Description 
------------+--------------------------------+-----------+----------+--------------------------------------------+----------+-------------+--------------+-------------
 payout_id  | integer                        |           | not null | nextval('payouts_payout_id_seq'::regclass) | plain    |             |              | 
 order_id   | integer                        |           | not null |                                            | plain    |             |              | 
 ln_invoice | text                           |           | not null |                                            | extended |             |              | 
 status     | text                           |           |          | 'pending'::character varying               | extended |             |              | 
 created_at | timestamp(3) without time zone |           |          | CURRENT_TIMESTAMP                          | plain    |             |              | 
 updated_at | timestamp(3) without time zone |           |          | CURRENT_TIMESTAMP                          | plain    |             |              | 
Indexes:
    "payouts_pkey" PRIMARY KEY, btree (payout_id)
Foreign-key constraints:
    "payouts_order_id_fkey" FOREIGN KEY (order_id) REFERENCES orders(order_id) ON UPDATE CASCADE ON DELETE RESTRICT
Access method: heap

               Sequence "public.payouts_payout_id_seq"
  Type   | Start | Minimum |  Maximum   | Increment | Cycles? | Cache 
---------+-------+---------+------------+-----------+---------+-------
 integer |     1 |       1 | 2147483647 |         1 | no      |     1
Owned by: public.payouts.payout_id

                   Index "public.payouts_pkey"
  Column   |  Type   | Key? | Definition | Storage | Stats target 
-----------+---------+------+------------+---------+--------------
 payout_id | integer | yes  | payout_id  | plain   | 
primary key, btree, for table "public.payouts"

                                                                      Table "public.users"
    Column    |              Type              | Collation | Nullable |              Default              | Storage  | Compression | Stats target | Description 
--------------+--------------------------------+-----------+----------+-----------------------------------+----------+-------------+--------------+-------------
 id           | integer                        |           | not null | nextval('users_id_seq'::regclass) | plain    |             |              | 
 username     | text                           |           | not null |                                   | extended |             |              | 
 created_at   | timestamp(3) without time zone |           |          | CURRENT_TIMESTAMP                 | plain    |             |              | 
 invoice      | text                           |           |          |                                   | extended |             |              | 
 status       | text                           |           |          |                                   | extended |             |              | 
 payment_hash | text                           |           |          |                                   | extended |             |              | 
 password     | text                           |           | not null |                                   | extended |             |              | 
Indexes:
    "users_pkey" PRIMARY KEY, btree (id)
    "users_username_key" UNIQUE, btree (username)
Access method: heap

                    Sequence "public.users_id_seq"
  Type   | Start | Minimum |  Maximum   | Increment | Cycles? | Cache 
---------+-------+---------+------------+-----------+---------+-------
 integer |     1 |       1 | 2147483647 |         1 | no      |     1
Owned by: public.users.id

                   Index "public.users_pkey"
 Column |  Type   | Key? | Definition | Storage | Stats target 
--------+---------+------+------------+---------+--------------
 id     | integer | yes  | id         | plain   | 
primary key, btree, for table "public.users"

               Index "public.users_username_key"
  Column  | Type | Key? | Definition | Storage  | Stats target 
----------+------+------+------------+----------+--------------
 username | text | yes  | username   | extended | 
unique, btree, for table "public.users"

     table_name     |     column_name     |          data_type          | character_maximum_length 
--------------------+---------------------+-----------------------------+--------------------------
 payment_hashes     | order_id            | integer                     |                         
 orders             | customer_id         | integer                     |                         
 orders             | created_at          | timestamp without time zone |                         
 payment_hashes     | amount_sat          | bigint                      |                         
 orders             | amount_msat         | integer                     |                         
 _prisma_migrations | finished_at         | timestamp with time zone    |                         
 payment_hashes     | created_at          | timestamp without time zone |                         
 payment_hashes     | expires_at          | timestamp without time zone |                         
 _prisma_migrations | rolled_back_at      | timestamp with time zone    |                         
 _prisma_migrations | started_at          | timestamp with time zone    |                         
 _prisma_migrations | applied_steps_count | integer                     |                         
 chats              | chat_id             | integer                     |                         
 chats              | order_id            | integer                     |                         
 payouts            | payout_id           | integer                     |                         
 payouts            | order_id            | integer                     |                         
 chats              | created_at          | timestamp without time zone |                         
 orders             | type                | smallint                    |                         
 orders             | premium             | numeric                     |                         
 invoices           | invoice_id          | integer                     |                         
 invoices           | order_id            | integer                     |                         
 payouts            | created_at          | timestamp without time zone |                         
 invoices           | amount_msat         | bigint                      |                         
 payouts            | updated_at          | timestamp without time zone |                         
 users              | id                  | integer                     |                         
 invoices           | created_at          | timestamp without time zone |                         
 invoices           | expires_at          | timestamp without time zone |                         
 orders             | taker_customer_id   | integer                     |                         
 users              | created_at          | timestamp without time zone |                         
 orders             | order_id            | integer                     |                         
 payment_hashes     | id                  | integer                     |                         
 invoices           | user_type           | text                        |                         
 orders             | order_details       | text                        |                         
 orders             | currency            | text                        |                         
 orders             | payment_method      | text                        |                         
 orders             | status              | text                        |                         
 orders             | escrow_status       | text                        |                         
 payment_hashes     | payment_hash        | text                        |                         
 payment_hashes     | payment_secret      | text                        |                         
 payment_hashes     | status              | text                        |                         
 payouts            | ln_invoice          | text                        |                         
 payouts            | status              | text                        |                         
 users              | username            | text                        |                         
 users              | invoice             | text                        |                         
 users              | status              | text                        |                         
 users              | payment_hash        | text                        |                         
 users              | password            | text                        |                         
 _prisma_migrations | id                  | character varying           |                       36
 _prisma_migrations | checksum            | character varying           |                       64
 _prisma_migrations | migration_name      | character varying           |                      255
 _prisma_migrations | logs                | text                        |                         
 chats              | chatroom_url        | text                        |                         
 chats              | status              | text                        |                         
 chats              | accept_offer_url    | text                        |                         
 chats              | token               | text                        |                         
 invoices           | bolt11              | text                        |                         
 invoices           | description         | text                        |                         
 invoices           | status              | text                        |                         
 invoices           | payment_hash        | text                        |                         
 invoices           | invoice_type        | text                        |                         
(59 rows)

     table_name     |     constraint_name     | column_name 
--------------------+-------------------------+-------------
 _prisma_migrations | _prisma_migrations_pkey | id
 users              | users_pkey              | id
 chats              | chats_pkey              | chat_id
 invoices           | invoices_pkey           | invoice_id
 orders             | orders_pkey             | order_id
 payment_hashes     | payment_hashes_pkey     | id
 payouts            | payouts_pkey            | payout_id
(7 rows)

 table_name | column_name | foreign_table_name | foreign_column_name 
------------+-------------+--------------------+---------------------
 chats      | order_id    | orders             | order_id
 payouts    | order_id    | orders             | order_id
(2 rows)

     tablename      |                      indexname                      |                                                                      indexdef                                                                      
--------------------+-----------------------------------------------------+----------------------------------------------------------------------------------------------------------------------------------------------------
 _prisma_migrations | _prisma_migrations_pkey                             | CREATE UNIQUE INDEX _prisma_migrations_pkey ON public._prisma_migrations USING btree (id)
 users              | users_pkey                                          | CREATE UNIQUE INDEX users_pkey ON public.users USING btree (id)
 chats              | chats_pkey                                          | CREATE UNIQUE INDEX chats_pkey ON public.chats USING btree (chat_id)
 invoices           | invoices_pkey                                       | CREATE UNIQUE INDEX invoices_pkey ON public.invoices USING btree (invoice_id)
 orders             | orders_pkey                                         | CREATE UNIQUE INDEX orders_pkey ON public.orders USING btree (order_id)
 payment_hashes     | payment_hashes_pkey                                 | CREATE UNIQUE INDEX payment_hashes_pkey ON public.payment_hashes USING btree (id)
 payouts            | payouts_pkey                                        | CREATE UNIQUE INDEX payouts_pkey ON public.payouts USING btree (payout_id)
 users              | users_username_key                                  | CREATE UNIQUE INDEX users_username_key ON public.users USING btree (username)
 invoices           | invoices_order_id_user_type_invoice_type_status_key | CREATE UNIQUE INDEX invoices_order_id_user_type_invoice_type_status_key ON public.invoices USING btree (order_id, user_type, invoice_type, status)
(9 rows)

