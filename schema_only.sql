--
-- PostgreSQL database dump
--

-- Dumped from database version 14.11 (Ubuntu 14.11-0ubuntu0.22.04.1)
-- Dumped by pg_dump version 14.11 (Ubuntu 14.11-0ubuntu0.22.04.1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: dave
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


ALTER TABLE public._prisma_migrations OWNER TO dave;

--
-- Name: chats; Type: TABLE; Schema: public; Owner: dave
--

CREATE TABLE public.chats (
    chat_id integer NOT NULL,
    order_id integer NOT NULL,
    chatroom_url text NOT NULL,
    status text DEFAULT 'pending'::character varying,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP,
    accept_offer_url text,
    token text
);


ALTER TABLE public.chats OWNER TO dave;

--
-- Name: chats_chat_id_seq; Type: SEQUENCE; Schema: public; Owner: dave
--

CREATE SEQUENCE public.chats_chat_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.chats_chat_id_seq OWNER TO dave;

--
-- Name: chats_chat_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: dave
--

ALTER SEQUENCE public.chats_chat_id_seq OWNED BY public.chats.chat_id;


--
-- Name: invoices; Type: TABLE; Schema: public; Owner: dave
--

CREATE TABLE public.invoices (
    invoice_id integer NOT NULL,
    order_id integer,
    bolt11 text NOT NULL,
    amount_msat bigint NOT NULL,
    description text,
    status text DEFAULT 'pending'::character varying,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP,
    expires_at timestamp(3) without time zone,
    payment_hash text,
    invoice_type text,
    user_type text
);


ALTER TABLE public.invoices OWNER TO dave;

--
-- Name: invoices_invoice_id_seq; Type: SEQUENCE; Schema: public; Owner: dave
--

CREATE SEQUENCE public.invoices_invoice_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.invoices_invoice_id_seq OWNER TO dave;

--
-- Name: invoices_invoice_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: dave
--

ALTER SEQUENCE public.invoices_invoice_id_seq OWNED BY public.invoices.invoice_id;


--
-- Name: orders; Type: TABLE; Schema: public; Owner: dave
--

CREATE TABLE public.orders (
    order_id integer NOT NULL,
    customer_id integer,
    order_details text,
    amount_msat integer,
    currency text NOT NULL,
    payment_method text,
    status text DEFAULT 'pending'::character varying,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP,
    escrow_status text DEFAULT 'pending'::character varying,
    type smallint,
    premium numeric(65,30) DEFAULT 0.00,
    taker_customer_id integer
);


ALTER TABLE public.orders OWNER TO dave;

--
-- Name: orders_order_id_seq; Type: SEQUENCE; Schema: public; Owner: dave
--

CREATE SEQUENCE public.orders_order_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.orders_order_id_seq OWNER TO dave;

--
-- Name: orders_order_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: dave
--

ALTER SEQUENCE public.orders_order_id_seq OWNED BY public.orders.order_id;


--
-- Name: payment_hashes; Type: TABLE; Schema: public; Owner: dave
--

CREATE TABLE public.payment_hashes (
    id integer NOT NULL,
    order_id integer,
    payment_hash text NOT NULL,
    payment_secret text,
    amount_sat bigint NOT NULL,
    status text DEFAULT 'pending'::character varying,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP,
    expires_at timestamp(3) without time zone
);


ALTER TABLE public.payment_hashes OWNER TO dave;

--
-- Name: payment_hashes_id_seq; Type: SEQUENCE; Schema: public; Owner: dave
--

CREATE SEQUENCE public.payment_hashes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.payment_hashes_id_seq OWNER TO dave;

--
-- Name: payment_hashes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: dave
--

ALTER SEQUENCE public.payment_hashes_id_seq OWNED BY public.payment_hashes.id;


--
-- Name: payouts; Type: TABLE; Schema: public; Owner: dave
--

CREATE TABLE public.payouts (
    payout_id integer NOT NULL,
    order_id integer NOT NULL,
    ln_invoice text NOT NULL,
    status text DEFAULT 'pending'::character varying,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.payouts OWNER TO dave;

--
-- Name: payouts_payout_id_seq; Type: SEQUENCE; Schema: public; Owner: dave
--

CREATE SEQUENCE public.payouts_payout_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.payouts_payout_id_seq OWNER TO dave;

--
-- Name: payouts_payout_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: dave
--

ALTER SEQUENCE public.payouts_payout_id_seq OWNED BY public.payouts.payout_id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: dave
--

CREATE TABLE public.users (
    id integer NOT NULL,
    username text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP,
    invoice text,
    status text,
    payment_hash text,
    password text NOT NULL
);


ALTER TABLE public.users OWNER TO dave;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: dave
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.users_id_seq OWNER TO dave;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: dave
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: chats chat_id; Type: DEFAULT; Schema: public; Owner: dave
--

ALTER TABLE ONLY public.chats ALTER COLUMN chat_id SET DEFAULT nextval('public.chats_chat_id_seq'::regclass);


--
-- Name: invoices invoice_id; Type: DEFAULT; Schema: public; Owner: dave
--

ALTER TABLE ONLY public.invoices ALTER COLUMN invoice_id SET DEFAULT nextval('public.invoices_invoice_id_seq'::regclass);


--
-- Name: orders order_id; Type: DEFAULT; Schema: public; Owner: dave
--

ALTER TABLE ONLY public.orders ALTER COLUMN order_id SET DEFAULT nextval('public.orders_order_id_seq'::regclass);


--
-- Name: payment_hashes id; Type: DEFAULT; Schema: public; Owner: dave
--

ALTER TABLE ONLY public.payment_hashes ALTER COLUMN id SET DEFAULT nextval('public.payment_hashes_id_seq'::regclass);


--
-- Name: payouts payout_id; Type: DEFAULT; Schema: public; Owner: dave
--

ALTER TABLE ONLY public.payouts ALTER COLUMN payout_id SET DEFAULT nextval('public.payouts_payout_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: dave
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: dave
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: chats chats_pkey; Type: CONSTRAINT; Schema: public; Owner: dave
--

ALTER TABLE ONLY public.chats
    ADD CONSTRAINT chats_pkey PRIMARY KEY (chat_id);


--
-- Name: invoices invoices_pkey; Type: CONSTRAINT; Schema: public; Owner: dave
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_pkey PRIMARY KEY (invoice_id);


--
-- Name: orders orders_pkey; Type: CONSTRAINT; Schema: public; Owner: dave
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (order_id);


--
-- Name: payment_hashes payment_hashes_pkey; Type: CONSTRAINT; Schema: public; Owner: dave
--

ALTER TABLE ONLY public.payment_hashes
    ADD CONSTRAINT payment_hashes_pkey PRIMARY KEY (id);


--
-- Name: payouts payouts_pkey; Type: CONSTRAINT; Schema: public; Owner: dave
--

ALTER TABLE ONLY public.payouts
    ADD CONSTRAINT payouts_pkey PRIMARY KEY (payout_id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: dave
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: invoices_order_id_user_type_invoice_type_status_key; Type: INDEX; Schema: public; Owner: dave
--

CREATE UNIQUE INDEX invoices_order_id_user_type_invoice_type_status_key ON public.invoices USING btree (order_id, user_type, invoice_type, status);


--
-- Name: users_username_key; Type: INDEX; Schema: public; Owner: dave
--

CREATE UNIQUE INDEX users_username_key ON public.users USING btree (username);


--
-- Name: chats chats_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: dave
--

ALTER TABLE ONLY public.chats
    ADD CONSTRAINT chats_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(order_id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: payouts payouts_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: dave
--

ALTER TABLE ONLY public.payouts
    ADD CONSTRAINT payouts_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(order_id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- PostgreSQL database dump complete
--

