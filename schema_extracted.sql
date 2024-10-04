                        Table "public._prisma_migrations"
       Column        |           Type           | Collation | Nullable | Default 
---------------------+--------------------------+-----------+----------+---------
 id                  | character varying(36)    |           | not null | 
 checksum            | character varying(64)    |           | not null | 
 finished_at         | timestamp with time zone |           |          | 
 migration_name      | character varying(255)   |           | not null | 
 logs                | text                     |           |          | 
 rolled_back_at      | timestamp with time zone |           |          | 
 started_at          | timestamp with time zone |           | not null | now()
 applied_steps_count | integer                  |           | not null | 0
Indexes:
    "_prisma_migrations_pkey" PRIMARY KEY, btree (id)

       Index "public._prisma_migrations_pkey"
 Column |         Type          | Key? | Definition 
--------+-----------------------+------+------------
 id     | character varying(36) | yes  | id
primary key, btree, for table "public._prisma_migrations"

                                               Table "public.chats"
      Column      |              Type              | Collation | Nullable |                Default                 
------------------+--------------------------------+-----------+----------+----------------------------------------
 chat_id          | integer                        |           | not null | nextval('chats_chat_id_seq'::regclass)
 order_id         | integer                        |           | not null | 
 chatroom_url     | text                           |           | not null | 
 status           | text                           |           |          | 'pending'::character varying
 created_at       | timestamp(3) without time zone |           |          | CURRENT_TIMESTAMP
 accept_offer_url | text                           |           |          | 
 token            | text                           |           |          | 
Indexes:
    "chats_pkey" PRIMARY KEY, btree (chat_id)
Foreign-key constraints:
    "chats_order_id_fkey" FOREIGN KEY (order_id) REFERENCES orders(order_id) ON UPDATE CASCADE ON DELETE RESTRICT

                 Sequence "public.chats_chat_id_seq"
  Type   | Start | Minimum |  Maximum   | Increment | Cycles? | Cache 
---------+-------+---------+------------+-----------+---------+-------
 integer |     1 |       1 | 2147483647 |         1 | no      |     1
Owned by: public.chats.chat_id

       Index "public.chats_pkey"
 Column  |  Type   | Key? | Definition 
---------+---------+------+------------
 chat_id | integer | yes  | chat_id
primary key, btree, for table "public.chats"

                                               Table "public.invoices"
    Column    |              Type              | Collation | Nullable |                   Default                    
--------------+--------------------------------+-----------+----------+----------------------------------------------
 invoice_id   | integer                        |           | not null | nextval('invoices_invoice_id_seq'::regclass)
 order_id     | integer                        |           |          | 
 bolt11       | text                           |           | not null | 
 amount_msat  | bigint                         |           | not null | 
 description  | text                           |           |          | 
 status       | text                           |           |          | 'pending'::character varying
 created_at   | timestamp(3) without time zone |           |          | CURRENT_TIMESTAMP
 expires_at   | timestamp(3) without time zone |           |          | 
 payment_hash | text                           |           |          | 
 invoice_type | text                           |           |          | 
 user_type    | text                           |           |          | 
Indexes:
    "invoices_pkey" PRIMARY KEY, btree (invoice_id)
    "invoices_order_id_user_type_invoice_type_status_key" UNIQUE, btree (order_id, user_type, invoice_type, status)

              Sequence "public.invoices_invoice_id_seq"
  Type   | Start | Minimum |  Maximum   | Increment | Cycles? | Cache 
---------+-------+---------+------------+-----------+---------+-------
 integer |     1 |       1 | 2147483647 |         1 | no      |     1
Owned by: public.invoices.invoice_id

Index "public.invoices_order_id_user_type_invoice_type_status_key"
    Column    |  Type   | Key? |  Definition  
--------------+---------+------+--------------
 order_id     | integer | yes  | order_id
 user_type    | text    | yes  | user_type
 invoice_type | text    | yes  | invoice_type
 status       | text    | yes  | status
unique, btree, for table "public.invoices"

       Index "public.invoices_pkey"
   Column   |  Type   | Key? | Definition 
------------+---------+------+------------
 invoice_id | integer | yes  | invoice_id
primary key, btree, for table "public.invoices"

                                                Table "public.orders"
      Column       |              Type              | Collation | Nullable |                 Default                  
-------------------+--------------------------------+-----------+----------+------------------------------------------
 order_id          | integer                        |           | not null | nextval('orders_order_id_seq'::regclass)
 customer_id       | integer                        |           |          | 
 order_details     | text                           |           |          | 
 amount_msat       | integer                        |           |          | 
 currency          | text                           |           | not null | 
 payment_method    | text                           |           |          | 
 status            | text                           |           |          | 'pending'::character varying
 created_at        | timestamp(3) without time zone |           |          | CURRENT_TIMESTAMP
 escrow_status     | text                           |           |          | 'pending'::character varying
 type              | smallint                       |           |          | 
 premium           | numeric(65,30)                 |           |          | 0.00
 taker_customer_id | integer                        |           |          | 
Indexes:
    "orders_pkey" PRIMARY KEY, btree (order_id)
Referenced by:
    TABLE "chats" CONSTRAINT "chats_order_id_fkey" FOREIGN KEY (order_id) REFERENCES orders(order_id) ON UPDATE CASCADE ON DELETE RESTRICT
    TABLE "payouts" CONSTRAINT "payouts_order_id_fkey" FOREIGN KEY (order_id) REFERENCES orders(order_id) ON UPDATE CASCADE ON DELETE RESTRICT

                Sequence "public.orders_order_id_seq"
  Type   | Start | Minimum |  Maximum   | Increment | Cycles? | Cache 
---------+-------+---------+------------+-----------+---------+-------
 integer |     1 |       1 | 2147483647 |         1 | no      |     1
Owned by: public.orders.order_id

       Index "public.orders_pkey"
  Column  |  Type   | Key? | Definition 
----------+---------+------+------------
 order_id | integer | yes  | order_id
primary key, btree, for table "public.orders"

                                            Table "public.payment_hashes"
     Column     |              Type              | Collation | Nullable |                  Default                   
----------------+--------------------------------+-----------+----------+--------------------------------------------
 id             | integer                        |           | not null | nextval('payment_hashes_id_seq'::regclass)
 order_id       | integer                        |           |          | 
 payment_hash   | text                           |           | not null | 
 payment_secret | text                           |           |          | 
 amount_sat     | bigint                         |           | not null | 
 status         | text                           |           |          | 'pending'::character varying
 created_at     | timestamp(3) without time zone |           |          | CURRENT_TIMESTAMP
 expires_at     | timestamp(3) without time zone |           |          | 
Indexes:
    "payment_hashes_pkey" PRIMARY KEY, btree (id)

               Sequence "public.payment_hashes_id_seq"
  Type   | Start | Minimum |  Maximum   | Increment | Cycles? | Cache 
---------+-------+---------+------------+-----------+---------+-------
 integer |     1 |       1 | 2147483647 |         1 | no      |     1
Owned by: public.payment_hashes.id

  Index "public.payment_hashes_pkey"
 Column |  Type   | Key? | Definition 
--------+---------+------+------------
 id     | integer | yes  | id
primary key, btree, for table "public.payment_hashes"

                                             Table "public.payouts"
   Column   |              Type              | Collation | Nullable |                  Default                   
------------+--------------------------------+-----------+----------+--------------------------------------------
 payout_id  | integer                        |           | not null | nextval('payouts_payout_id_seq'::regclass)
 order_id   | integer                        |           | not null | 
 ln_invoice | text                           |           | not null | 
 status     | text                           |           |          | 'pending'::character varying
 created_at | timestamp(3) without time zone |           |          | CURRENT_TIMESTAMP
 updated_at | timestamp(3) without time zone |           |          | CURRENT_TIMESTAMP
Indexes:
    "payouts_pkey" PRIMARY KEY, btree (payout_id)
Foreign-key constraints:
    "payouts_order_id_fkey" FOREIGN KEY (order_id) REFERENCES orders(order_id) ON UPDATE CASCADE ON DELETE RESTRICT

               Sequence "public.payouts_payout_id_seq"
  Type   | Start | Minimum |  Maximum   | Increment | Cycles? | Cache 
---------+-------+---------+------------+-----------+---------+-------
 integer |     1 |       1 | 2147483647 |         1 | no      |     1
Owned by: public.payouts.payout_id

       Index "public.payouts_pkey"
  Column   |  Type   | Key? | Definition 
-----------+---------+------+------------
 payout_id | integer | yes  | payout_id
primary key, btree, for table "public.payouts"

                                           Table "public.users"
    Column    |              Type              | Collation | Nullable |              Default              
--------------+--------------------------------+-----------+----------+-----------------------------------
 id           | integer                        |           | not null | nextval('users_id_seq'::regclass)
 username     | text                           |           | not null | 
 created_at   | timestamp(3) without time zone |           |          | CURRENT_TIMESTAMP
 invoice      | text                           |           |          | 
 status       | text                           |           |          | 
 payment_hash | text                           |           |          | 
 password     | text                           |           | not null | 
Indexes:
    "users_pkey" PRIMARY KEY, btree (id)
    "users_username_key" UNIQUE, btree (username)

                    Sequence "public.users_id_seq"
  Type   | Start | Minimum |  Maximum   | Increment | Cycles? | Cache 
---------+-------+---------+------------+-----------+---------+-------
 integer |     1 |       1 | 2147483647 |         1 | no      |     1
Owned by: public.users.id

      Index "public.users_pkey"
 Column |  Type   | Key? | Definition 
--------+---------+------+------------
 id     | integer | yes  | id
primary key, btree, for table "public.users"

  Index "public.users_username_key"
  Column  | Type | Key? | Definition 
----------+------+------+------------
 username | text | yes  | username
unique, btree, for table "public.users"

